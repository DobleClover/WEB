import nodemailer from "nodemailer";
import emailConfig from "../staticDB/mailConfig.js";
import dateFormater from "./dateFormater.js";
// import dateFormater from'./dateFormater';
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const purchaseFilePath = path.resolve(__dirname, "../imgs/purchaseImage.png");
async function sendOrderMails(order) {
  // Configuración del transporte del correo
  const transporter = nodemailer.createTransport(emailConfig);

  // Contenido del correo
  const userMailContent = generateMailContent(order, true);
  const operatorMailContent = generateMailContent(order, false);
  // Opciones del correo
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: order.email,
    subject: "¡Gracias por tu compra!",
    html: userMailContent,
    attachments: [
      {
        filename: "purchaseImage.png",
        path: purchaseFilePath, // Ruta absoluta de la imagen
        cid: "purchaseImage", // Esto se usa en el src del HTML como "cid:purchaseImage"
      },
    ],
  };
  const operatorMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `Venta online - ${order.tra_id}`,
    html: operatorMailContent,
  };
  try {
    // Envío de los correos
    const userMail = await transporter.sendMail(userMailOptions);
    const operatorMail = await transporter.sendMail(operatorMailOptions);
    console.log("Correos enviados");
    return;
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

export default sendOrderMails;

function generateMailContent(order, isUser = true) {
  const topSection = isUser
    ? `
      <tr>
        <td style="padding: 0; margin: 0;">
          <img src="cid:purchaseImage" alt="DobleClover" style="width: 100%; max-height: 220px; object-fit: cover; display: block;" />
        </td>
      </tr>
    `
    : `
      <tr>
        <td style="background-color: #758357; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
          Se ha registrado una venta
        </td>
      </tr>
    `;

  const paymentWarning =
    isUser && [2, 3].includes(order.paymentType.id)
      ? `
        <tr><td style="height: 30px;"></td></tr>
        <tr>
          <td style="text-align: center; background-color: #ffffff10; padding: 15px; border-radius: 8px;">
            <strong style="color: #ffdf7c;">IMPORTANTE:</strong><br/>
            Tu pedido deberá ser abonado dentro de las próximas <strong>24 horas</strong>, de lo contrario se cancelará automáticamente.
            ${
              order.paymentType.id === 3
                ? `
                  <br/><br/><strong>Datos de Transferencia:</strong><br/>
                  CVU: 0000168300000002703464<br/>
                  Alias: janopereiralemon
                `
                : ""
            }
          </td>
        </tr>
      `
      : "";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Confirmación de compra</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 20px; background-color: #f5f5f5;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="border-radius: 10px; overflow: hidden;">
              ${topSection}
              <tr>
                <td style="background-color: #758357; color: white; padding: 20px;">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="text-align: center;">
                        <strong>ID de venta:</strong><br/>
                        ${order.tra_id}
                      </td>
                    </tr>
                    <tr><td><hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" /></td></tr>

                    <tr>
                      <td style="text-align: center;">
                        <strong>Fecha:</strong><br/>
                        ${dateFormater(order.createdAt, false)}
                      </td>
                    </tr>
                    <tr><td><hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" /></td></tr>

                    <tr>
                      <td style="text-align: center;">
                        <strong>Datos de Facturación</strong><br/>
                        ${order.first_name} ${order.last_name}<br/>
                        Tel: +${order.phone_code} ${order.phone_number}<br/>
                        DNI: ${order.dni}
                      </td>
                    </tr>
                    <tr><td><hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" /></td></tr>

                    <tr>
                      <td style="text-align: center;">
                        <strong>Tipo de Entrega:</strong> ${
                          order.shippingType?.type
                        }<br/>
                        ${
                          order.shippingType?.id == 1
                            ? `
                              ${order.shipping_address_street}${
                                order.shipping_address_detail
                                  ? " (" + order.shipping_address_detail + ")"
                                  : ""
                              }<br/>
                              C.P. ${order.shipping_address_zip_code}<br/>
                              ${order.shipping_address_city}, ${
                                order.shipping_address_province
                              }
                            `
                            : order.shippingType?.id == 2
                            ? "Nuñez / Belgrano (a coordinar)"
                            : ""
                        }
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 20px 0; text-align: center;">
                        <hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" />
                        <h3 style="margin-bottom: 10px;">${isUser ? 'Detalle de tu pedido' : 'Detalle de la orden'}</h3>
                        <table width="100%" style="font-size: 14px; text-align: center;">
                          ${order.orderItems
                            .map(
                              (item) => `
                            <tr style="border-bottom: 1px solid #ffffff30;">
                              <td style="padding: 15px 0;">
                                <div><strong>Item:</strong> ${item.name}</div>
                                <div><strong>Color / Talle:</strong> ${
                                  item.color
                                } - ${item.size}</div>
                                <div><strong>Precio (un):</strong> $${
                                  item.price
                                }</div>
                                <div><strong>Cantidad:</strong> ${
                                  item.quantity
                                }</div>
                                <div><strong>Subtotal:</strong> $${(
                                  parseInt(item.quantity) *
                                  parseFloat(item.price)
                                ).toFixed(2)}</div>
                              </td>
                            </tr>
                          `
                            )
                            .join("")}
                        </table>
                        <hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" />
                        <div style="font-size: 16px; font-weight: bold; margin-top: 10px;">
                          TOTAL: $${order.total}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ffffff30; margin: 20px 0;" />
                      </td>
                    </tr>

                    <tr>
                      <td style="text-align: center;"><br/>
                        ${order.paymentType?.type}
                      </td>
                    </tr>

                    ${paymentWarning}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
