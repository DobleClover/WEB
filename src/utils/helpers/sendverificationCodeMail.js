// import nodemailer from 'nodemailer';
import emailConfig from "../staticDB/mailConfig.js";
import nodemailer from "nodemailer";
import getBase64ImageSrc from "./getBase64ImageSrc.js";
// way to replace __dirname in es modules
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../imgs/logo.png");
const bgImgPath = path.resolve(__dirname, "../imgs/bg.png");
async function sendCodesMail(type = 1, obj = {}) {
  const code = obj.code ? obj.code.split("") : null; //Lo armo array
  let { user } = obj;
  // Configuración del transporte del correo
  // const transporter = nodemailer.createTransport(emailConfig);
  let transporter = nodemailer.createTransport(emailConfig);
  // Contenido del correo
  let userMailContent =
    type == 1
      ? `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verificación de Registro</title>
          <style>
              @media only screen and (max-width: 600px) {
                  .email-container {
                      width: 100% !important;
                      padding: 10px !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                  <td align="center">
                      <table role="presentation" width="500px" class="email-container" cellspacing="0" cellpadding="0" border="0" style="background-color: #758357; border-radius: 10px; padding: 20px; text-align: center; color: #ffffff; max-width: 100%;">
                          <tr>
                              <td align="center" style="padding: 10px;">
                                  <img src="cid:logoImage" alt="DobleClover Logo" width="100" style="display: block; margin: auto; max-width: 80%;">
                              </td>
                          </tr>
                          <tr>
                              <td align="center" style="padding: 10px;">
                                  <img src="cid:bgImage" alt="Verificación" width="100%" style="border-radius: 10px; display: block; height: auto; max-height: 400px;">
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 10px; font-size: 16px; color: #ffffff;">
                                  Hola ${
                                    user.first_name
                                  }, del equipo DobleClover te damos la bienvenida.
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 10px; font-size: 16px; color: #ffffff;">
                                  Tu código de verificación es:
                              </td>
                          </tr>
                          <tr>
                              <td style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px; color: #ffffff;">
                                  ${code.join(" ")}
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 10px; font-size: 14px; color: #bbbbbb;">
                                  (Expira en 30 minutos)
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>`
      : `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Recuperación de Contraseña</title>
          <style>
              @media only screen and (max-width: 600px) {
                  .email-container {
                      width: 100% !important;
                      padding: 10px !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #758357; padding: 20px; color: #ffffff;">
              <tr>
                  <td align="center">
                      <img src="cid:logoImage" alt="DobleClover Logo" width="100" style="display: block; margin: auto; max-width: 80%;">
                  </td>
              </tr>
              <tr>
                  <td align="center" style="padding: 20px; font-size: 16px;">
                      Hola <strong>${user.first_name}</strong>,
                      <br><br>
                      Recibimos un pedido de tu cuenta para actualizar tu contraseña.
                  </td>
              </tr>
              <tr>
                  <td align="center" style="padding: 20px;">
                      <a href="${obj.link}" target="_blank" style="
                          display: inline-block;
                          padding: 12px 24px;
                          font-size: 16px;
                          font-weight: bold;
                          color: #000000;
                          background-color: #ffffff;
                          text-decoration: none;
                          border-radius: 8px;
                          border: 2px solid #ffffff;
                          transition: all 0.3s ease-in-out;">
                          Cambiar Contraseña
                      </a>
                  </td>
              </tr>
              <tr>
                  <td align="center" style="padding: 20px; font-size: 14px;">
  <strong>¿No fuiste vos?</strong><br>
  Si tú no solicitaste esto, <a href="${obj.logoutAllLink}" style="color: #ffffff; font-weight: bold; text-decoration: underline;">
    haz click aquí para cerrar todas tus sesiones
  </a>.
</td>
              </tr>
          </table>
      </body>
      </html>`;
  const subject =
    type == 1 ? "Codigo de Verificación" : "Recuperación de contraseña";
  // Opciones del correo
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject,
    html: userMailContent,
    attachments: [
      {
        filename: "logo.png",
        path: logoPath, // Ruta absoluta de la imagen
        cid: "logoImage", // Esto se usa en el src del HTML como "cid:logoImage"
      },
    ],
  };
  if (type == 1) {
    userMailOptions.attachments.push({
      filename: "bg.png",
      path: bgImgPath,
      cid: "bgImage", // Usado en el src del HTML como "cid:bgImage"
    });
  }
  try {
    // Envío de los correos
    const userMail = await transporter.sendMail(userMailOptions);
    console.log("Correos enviados:", userMail.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return false;
  }
}

export default sendCodesMail;
