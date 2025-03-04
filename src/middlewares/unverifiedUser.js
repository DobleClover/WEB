import jwt from 'jsonwebtoken';
const webTokenSecret =  process.env.JSONWEBTOKEN_SECRET;
import getRelativePath from '../utils/helpers/getRelativePath.js';
import { getUsersFromDB } from '../controllers/api/apiUserController.js';
const unverifiedUser = async (req, res, next) => {
    try {
        let userInCookie;
        res.locals.isLogged = false;
        req.session.userLoggedId = null;
        //Agarro la cookie del token
        const token = req.cookies?.userAccessToken;
        // Ruta a la que quiere ir
        let pathToGo = getRelativePath(req.url);
        // Si quiere ir a logout o al verify no quiero nada de aca
        if (pathToGo == '/logout') return next();
        if (token) {
            const decodedData = jwt.verify(token, webTokenSecret);
            if (decodedData) { //Si verifico el token, solo agarro el id
                userInCookie = await getUsersFromDB(decodedData?.id);
                userInCookie && delete userInCookie.password; // Para no llevar la password session
            } else { //Si no lo verifica, lo deslogueo
                res.clearCookie('userAccessToken');
                delete req.session.userLoggedId;
                return res.redirect('/');
            }
        };
        if (userInCookie) { //Si encontro el usuario en la cookie
            req.session.userLoggedId = userInCookie.id; //SESSION SIEMPRE EN REQ 
        };

        if (req.session && req.session.userLoggedId) {
            res.locals.isLogged = true;
            res.locals.userLogged = userInCookie;
            //ACa esta loggueado, me tengo que fijar si esta verificado
            if(!userInCookie.verified_email){
                if (pathToGo == '/verificar') return next(); //Si ya estaba yendo lo mando
                //Aca no esta verificado y taba tratando de ir a otro lugar, lo redirijo
                return res.redirect('/verificar');
            }
        };
        //Si alguien que no este loggueado quiere ir a verify lo mando al main
        // if (pathToGo == '/verify' && !userInCookie) return res.redirect('/');
        return next();


    } catch (error) {
        res.clearCookie('adminToken');
        console.log(`Hubo un error en el middleware userLogged: ${error}`)
        return res.redirect(`/`);
    }
}

export default unverifiedUser;
