import getRelativePath from "../utils/helpers/getRelativePath.js";
import {
  deleteSensitiveUserData,
  getUsersFromDB,
  verifyUserIsLogged,
} from "../controllers/api/apiUserController.js";
const unverifiedUser = async (req, res, next) => {
  try {
    let userLogged;
    res.locals.isLogged = false;
    req.session.userLoggedId = null;
    //Agarro la cookie del token
    const token = req.cookies?.userAccessToken;
    // Ruta a la que quiere ir
    let pathToGo = getRelativePath(req.url);
    // Si quiere ir a logout o al verify no quiero nada de aca
    if (pathToGo == "/logout") return next();
    if (token) {
      userLogged = await verifyUserIsLogged(token);
      if (userLogged) {
        //Si verifico el token, solo agarro el id
        deleteSensitiveUserData(userLogged);
      } else {
        //Si no lo verifica, lo deslogueo
        res.clearCookie("userAccessToken");
        delete req.session.userLoggedId;
        return res.redirect("/");
      }
    }
    if (userLogged) {
      //Si encontro el usuario en la cookie
      req.session.userLoggedId = userLogged.id; //SESSION SIEMPRE EN REQ
    }

    if (req.session && req.session.userLoggedId) {
      res.locals.isLogged = true;
      res.locals.userLogged = userLogged;
      //ACa esta loggueado, me tengo que fijar si esta verificado
      if (!userLogged.verified_email) {
        if (pathToGo == "/verificar") return next(); //Si ya estaba yendo lo mando
        //Aca no esta verificado y taba tratando de ir a otro lugar, lo redirijo
        return res.redirect("/verificar");
      }
    }
    //Si alguien que no este loggueado quiere ir a verify lo mando al main
    if (pathToGo == "/verificar" && !userLogged) return res.redirect("/");
    return next();
  } catch (error) {
    res.clearCookie("adminToken");
    console.log(`Hubo un error en el middleware userLogged: ${error}`);
    return res.redirect(`/`);
  }
};

export default unverifiedUser;
