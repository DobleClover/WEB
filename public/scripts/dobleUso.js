import { homeLabel } from "./componentRenderer.js";
import { createPaginatedProductLoader } from "./helpers/paginationLoader.js";
import { sortProductsByStockAndType } from "./helpers/productSortUtils.js";
import {
  animateSectionElements,
  getIdFromUrl,
  paintProductCardsInList,
  removeDoblecloverOverlay,
  scriptInitiator,
} from "./utils.js";

const steps = [
  {
    name: "1. Envíanos una foto",
    desc: `Si tenés ropa que podría interesarnos y sigue la línea de nuestra marca, envianos una foto y te diremos si es adecuada para ofrecerla en nuestra tienda.`,
  },
  {
    name: "2. Coordinamos el retiro",
    desc: `Si nos interesa coordinamos un retiro de la prenda con vos, para luego nosotros analizarla en persona. Evaluamos su estado y estimamos cuantos usos tiene.`,
  },
  {
    name: "3. Análisis de disponibilidad local",
    desc: `Realizamos un estudio para verificar si existen prendas similares disponibles actualmente en el mercado local.`,
  },
  {
    name: "4. Definimos el precio de venta",
    desc: `Luego del análisis, coordinamos una reunión para presentarte un precio estimado al que podríamos vender tu prenda en nuestra plataforma.`,
  },
  {
    name: "5. Formalización del acuerdo",
    desc: `Si estás de acuerdo, firmamos un contrato que establece las condiciones para ambas partes.`,
  },
  {
    name: "6. Producción de contenido",
    desc: `Realizamos fotos de alta calidad para potenciar la presentación y visibilidad del producto.`,
  },
  {
    name: "7. Publicación y visibilidad",
    desc: `Finalmente, publicamos tu prenda en nuestro Instagram y en el ecommerce. Vas a poder seguir su publicación y disponibilidad en tiempo real.`,
  },
];

window.addEventListener("load", async () => {
  try {
    await scriptInitiator();
    const stepsSection = document.querySelector(".steps_section");
    steps.forEach((step) => {
      const label = homeLabel({
        name: step.name,
        desc: step.desc,
      });
      stepsSection.appendChild(label);
    });
    // Activar el acordeón si estás usando Semantic UI
    if (typeof $ !== "undefined" && $.fn.accordion) {
      $(stepsSection).accordion();
    }
    createPaginatedProductLoader({
      wrapperSelector: ".dobleuso_wrapper",
      buttonSelector: "#loadMoreDobleuso",
      queryBuilder: ({ offset, hasStock, limit }) =>
        `/api/product?is_dobleuso=1&has_stock=${hasStock}&limit=${limit}&offset=${offset}`,
      onInitialRender: animateSectionElements,
    });

    removeDoblecloverOverlay();
  } catch (error) {
    return console.log(error);
  }
});

export async function fetchDropProducts(id) {
  const url = `${window.location.origin}/api/drop/${id}/products`;

  return (await (await fetch(url)).json()).data || [];
}
