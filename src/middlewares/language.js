import { getUsersFromDB } from '../controllers/api/apiUserController.js';
import { SPANISH } from '../utils/staticDB/languages.js';
import jwt from 'jsonwebtoken';
const { verify } = jwt;

export const languageMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.userAccessToken;
        if(token){
            const decodedData = verify(token, webTokenSecret);
            if(!decodedData){
                res.locals.language = SPANISH;
                return next();
            }
            const user = await getUsersFromDB(decodedData.id);
            res.locals.language = user?.preferred_language || null;
        } else {
            res.locals.language = null;
        }
    } catch (error) {
        console.log(`error in language middleware: ${error}`);    
        res.locals.language = SPANISH;
    }
    return next();
};