
import jwt from "jsonwebtoken";
import { getUsersFromDB } from "../controllers/api/apiUserController.js";
import { HTTP_STATUS } from "../utils/staticDB/httpStatusCodes.js";

const webTokenSecret = process.env.JSONWEBTOKEN_SECRET;

const userIsLoggedMiddleware = async (req, res, next) => {
    try {
        const { cookies } = req;
        const userAccessToken = cookies.userAccessToken;
        // 2️⃣ Si no hay cookie de adminAuth, revisar userAccessToken
        if (userAccessToken) {
            try {
                const decodedUserToken = jwt.verify(userAccessToken, webTokenSecret);
                
                if (!decodedUserToken.id) {
                    console.warn("Invalid user token structure");
                    res.clearCookie("userAccessToken"); // Si el token no tiene el ID, limpiarlo
                    return res.redirect('/')
                }

                // Consultar en la base de datos si existe el id
                const userFromDB = await getUsersFromDB(decodedUserToken.id);
                if (!userFromDB) {
                    console.warn("User not found in database");
                    res.clearCookie("userAccessToken"); // Limpiar cookie si el usuario no existe
                    return res.redirect('/')
                }
                return next();

            } catch (err) {
                console.error("Error verifying userIsLoggedMiddleware:", err);
                res.clearCookie("userAccessToken"); // Si hay error, limpiar token inválido
            }
        }

        // 3️⃣ Si no hay credenciales válidas, rechazar la solicitud
        return res.redirect('/')

    } catch (error) {
        console.error("Unexpected error in admin middleware:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error: "Internal server error" });
    }
};

export default userIsLoggedMiddleware; 