import nodemailer from "nodemailer";
import emailConfig from "../staticDB/mailConfig.js";
import dateFormater from "./dateFormater.js";
// import dateFormater from'./dateFormater';

async function sendOrderMails(order) {
  // Configuración del transporte del correo
  const transporter = nodemailer.createTransport(emailConfig);

  // Contenido del correo
  let userMailContentDeliveryMethod = ``;
  let operatorMailContentDeliveryMethod = ``;
  if (order.shipping_types_id == 1) {
    //Domicilio
    let addressTitleRow = `<p style="font-weight:600;">Envío a domicilio</p>`;
    userMailContentDeliveryMethod += addressTitleRow;
    operatorMailContentDeliveryMethod += addressTitleRow;
    let addressRow = `
                <p style="color: #666;">${order.shipping_address_street}${
      order.shipping_address_detail ? ` (${order.shipping_address_detail})` : ""
    } - C.P. ${order.shipping_address_zip_code} - ${
      order.shipping_address_city
    }, ${order.shipping_address_province}</p>
                `;
    userMailContentDeliveryMethod += addressRow;
    operatorMailContentDeliveryMethod += addressRow;
  } else if (order.shipping_types_id == 2) {
    //Retiro por local
    let pickupTitle = `<p style="font-weight:600;">Tipo de envio:</p>`;
    let pickUpRow = `<p>Retiro por CABA</p>`;
    userMailContentDeliveryMethod = `
    ${pickupTitle}
        ${pickUpRow}
        <p style="color: #666;">Nuñez / Belgrano</p>`;
    operatorMailContentDeliveryMethod = `<p style="font-weight:600;">Retiro por CABA</p>`;
  }

  //   Tabla con items
  let tableContent = ``;
  let orderItemsPrice = 0;
  order.orderItems.forEach((item) => {
    // const itemPrice = item.price * ( 1 - (item.discount||0)/100);
    tableContent += `
        <tr>
            <td style="width:25%;text-align:center;">${
              item.name
            } (${item.color} - ${item.size})</td>
            <td style="width:25%;text-align:center;">$${item.price}</td>
            <td style="width:25%;text-align:center;">${item.quantity}</td>
            <td style="width:25%;text-align:center;">$${
              parseInt(item.quantity) * parseFloat(item.price)
            }</td>
        </tr>
        `;
    orderItemsPrice += parseInt(item.quantity) * parseFloat(item.price);
  });
  const shippingPrice = order.total - orderItemsPrice;
  const userMailContent = `
    <main style="width:60%;margin: 0 auto;">
    <h2 style="font-weight:600;">Resumen de tu compra</h2>
      <p style="font-weight:600;">Id de venta</p>
    <p style="color: #666;">${order.tra_id}</p>
    <p style="font-weight:600;">Fecha</p>
    <p style="color: #666;">${dateFormater(order.createdAt, false)} (dd/mm/aaaa)</p>
    <p style="font-weight:600;">Datos de facturación</p>
    <p style="color: #666;">${order.first_name} ${order.last_name} - Tel: +${
    order.phone_code
  } ${order.phone_number} - DNI: ${order.dni}</p>
    ${userMailContentDeliveryMethod}
    
    <table style="width:100%">
      <tr>
        <th style="width:25%;text-align:center;">Item</th>
        <th style="width:25%;text-align:center;">Precio unitario</th>
        <th style="width:25%;text-align:center;">Cantidad</th>
        <th style="width:25%;text-align:center;">Subtotal</th>
      </tr>
      ${tableContent}
    </table>

    <p style="font-size:18px;margin-top:30px;color:#222;">Total: $${
      order.total
    }</p>
    </main>
  `;

  const operatorMailContent = `
    <main style="width:60%;margin: 0 auto;">
    <h2 style="font-weight:600;">Se ha registrado una venta</h2>
    <p style="font-weight:600;">Id de venta</p>
    <p style="color: #666;">${order.tra_id}</p>
    <p style="font-weight:600;">Fecha</p>
    <p style="color: #666;">${dateFormater(order.createdAt, false)}</p>
    <p style="font-weight:600;">Datos de facturación</p>
    <p style="color: #666;">Nombre:${order.first_name} ${
    order.last_name
  }<br>Tel: +${order.phone_code} ${order.phone_number}<br>DNI: ${
    order.dni
  }<br></p>
    ${operatorMailContentDeliveryMethod}
    
    <table style="width:100%">
      <tr>
        <th style="width:25%;text-align:center;">Item</th>
        <th style="width:25%;text-align:center;">Precio unitario</th>
        <th style="width:25%;text-align:center;">Cantidad</th>
        <th style="width:25%;text-align:center;">Subtotal</th>
      </tr>
      ${tableContent}
    </table>
    ${
      order.shipping_types_id == 1
        ? `<p style="font-size:18px;margin-top:30px;color:#222;">Envio: $${shippingPrice}</p>`
        : ""
    }
    <p style="font-size:22px;margin-top:30px;color:#222;">Total: $${
      order.total
    }</p>
    </main>
  `;
  // Opciones del correo
  const userMailOptions = {
    from: "dobleclover@gmail.com",
    to: order.email,
    subject:  "¡Gracias por tu compra!",
    html: userMailContent,
  };
  const operatorMailOptions = {
    from: "dobleclover@gmail.com",
    to: "dobleclover@gmail.com",
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
