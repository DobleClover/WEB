import { homeLabel } from "./componentRenderer.js";
import { scriptInitiator } from "./utils.js";

window.addEventListener("load", async() => {
  try {
    await scriptInitiator();
    const faqs = [
      {
        name: "Talles",
        desc: [
          `Te queremos informar que todos los productos que compres en nuestra marca están nuevos y si alguno está usado, lo aclararemos en las características del producto. Las imágenes que tenemos presentadas es cómo está realmente el producto porque luego de sacarle las fotos los guardamos en su bolsa.`,
          `Sobre cada producto vamos a pasarle las medidas exactas. Recomendamos tener en cuenta que a la hora de elegir el talle es mejor medir prendas que le gusten como referencia a los talles disponibles, ya que son talles ÚNICOS y no aceptamos ningún tipo de devolución o cambio del producto.`,
        ],
      },
      {
        name: "Envíos",
        desc: [
          `En nuestra marca te brindamos la opción de cotizar tu envío a través de la logística que usamos nosotros, Andreani, pidiéndote ciertos datos, o sino que vos mismo puedas usar tu logística y nos envías tu etiqueta de envío para que nosotros te la despachemos en la sucursal que nos quede más cerca (ANTES CONSULTAR).`,
          `Por última opción sin costo vas a poder retirar tu producto por Núñez, Capital Federal.`,
        ],
      },
      {
        name: "Comunidad de Whatsapp",
        desc: [
          "Acceso anticipado a lanzamientos y productos exclusivos.",
          "Descuentos únicos solo para miembros.",
          "Posibilidad de votar ideas para nuevos productos.",
          "Conexión directa con nuestro equipo y otras personas que comparten tus gustos.",
          `<a href="https://chat.whatsapp.com/B5EvmPMeMvnIfKT273Ihr7" target="_blank" style="color: #1c7ed6; text-decoration: underline;">Unite a la comunidad acá</a>`,
        ],
      },      
      {
        name: "Packaging",
        desc: "Todas las compras vienen con stickers y envueltas en una bolsa e-commerce de nuestra marca, cuidando cada detalle para que tu experiencia sea única desde que recibís el paquete.",
      },
    ];
    renderFaqs(faqs);
  } catch (error) {
    return console.log(error);
    
  }
});

function renderFaqs(faqs) {
  const container = document.querySelector(".faq_cards_section");
  if (!container) {
    console.error(
      "No se encontró un contenedor con la clase .faq_cards_section"
    );
    return;
  }

  faqs.forEach((faq) => {
    const faqCard = homeLabel(faq);
    container.appendChild(faqCard);
  });

  // Activar el acordeón si estás usando Semantic UI
  if (typeof $ !== "undefined" && $.fn.accordion) {
    $(container).accordion();
  }
}
