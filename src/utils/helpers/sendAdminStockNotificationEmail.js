import nodemailer from "nodemailer";
import emailConfig from "../staticDB/mailConfig.js";
import { getProductsFromDB } from "../../controllers/api/apiProductController.js";
import sizes from "../staticDB/sizes.js";
import countries from "../staticDB/countries.js";

export default async function sendAdminStockNotificationEmail(obj = {}) {
  try {
    const { products_id, sizes_id, email, phone_number, phone_countries_id } =
      obj;
    const transporter = nodemailer.createTransport(emailConfig);

    // Buscar producto
    const product = await getProductsFromDB({ id: products_id });
    const productName = product?.name || "Producto desconocido";

    // Buscar talle
    const size = sizes.find((s) => s.id == parseInt(sizes_id));
    const sizeLabel = size?.size || "Talle desconocido";
    // Buscar codigo de pais
    const country = countries.find(count => count.id == phone_countries_id);
    const countryCode = country.code;

    // Armar contenido HTML simple y claro
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2e7d32;">Nuevo aviso de stock registrado</h2>
        <p><strong>Numero del usuario:</strong> (+${countryCode})${phone_number}</p>
        <p><strong>Email del usuario:</strong> ${email}</p>
        <p><strong>Producto:</strong> ${productName} (ID: ${products_id})</p>
        <p><strong>Talle solicitado:</strong> ${sizeLabel}</p>
        <hr>
        <p style="font-size: 0.9em; color: #888;">Este es un aviso interno. No es necesario responder.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `🔔 Nuevo aviso de stock - ${productName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Aviso de stock enviado por email.");
  } catch (error) {
    console.error("❌ Error al enviar aviso de stock:", error);
  }
}
