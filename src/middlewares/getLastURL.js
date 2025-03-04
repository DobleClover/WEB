import getRelativePath from "../utils/helpers/getRelativePath.js";

export default function getLastURL(req,res,next){
    req.session.returnTo = getRelativePath(req.headers.referer); // Almacena la última URL en la sesión
    next();
}
