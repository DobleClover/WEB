import { createProductCard } from "./componentRenderer.js";
import { setSettings } from "./fetchEntitiesFromDB.js";
import { createPaginatedProductLoader } from "./helpers/paginationLoader.js";
import {
  animateSectionElements,
  listenToProductCards,
  paintProductCardsInList,
  productsFromDB,
  scriptInitiator,
  setProductsFromDB,
} from "./utils.js";

window.addEventListener("load", async () => {
  await scriptInitiator();
  bannerAnimation();
  // Animo los titulos
  const buttonsSection = document.querySelector(
    ".product_list_buttons_container"
  );
  setTimeout(() => animateSectionElements(buttonsSection), 500);
  const dobleCloverContainer = document.querySelector(
    ".product_cards_wrapper_section.dobleclover_wrapper"
  );
  const dobleUsoContainer = document.querySelector(
    ".product_cards_wrapper_section.dobleuso_wrapper"
  );
  // Primer render automático
  createPaginatedProductLoader({
    wrapperSelector: ".dobleclover_wrapper",
    buttonSelector: "#loadMoreDobleclover",
    queryBuilder: ({ offset, hasStock, limit }) =>
      `/api/product?is_dobleuso=0&has_stock=${hasStock}&limit=${limit}&offset=${offset}`,
    onInitialRender: animateSectionElements
  });
  
  createPaginatedProductLoader({
    wrapperSelector: ".dobleuso_wrapper",
    buttonSelector: "#loadMoreDobleuso",
    queryBuilder: ({ offset, hasStock, limit }) =>
      `/api/product?is_dobleuso=1&has_stock=${hasStock}&limit=${limit}&offset=${offset}`,
    onInitialRender: animateSectionElements
  });
  
  listenToFilterSelect();
});

function bannerAnimation() {
  const inner = document.querySelector(".rotator_inner");
  const items = document.querySelectorAll(".rotator_item");
  const totalItems = items.length;

  let currentIndex = 0;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalItems;
    inner.style.transform = `translateX(-${currentIndex * 100}vw)`;
  }, 6000); // Cada 3 segundos
}


function listenToFilterSelect() {
  document.getElementById("productFilter").addEventListener("change", (e) => {
    const value = e.target.value;

    const doblecloverElements = document.querySelectorAll(".dobleclover_element");
    const dobleusoElements = document.querySelectorAll(".dobleuso_element");

    if (value === "dobleclover") {
      doblecloverElements.forEach(el => el.classList.remove("hidden"));
      dobleusoElements.forEach(el => el.classList.add("hidden"));
    } else if (value === "dobleuso") {
      doblecloverElements.forEach(el => el.classList.add("hidden"));
      dobleusoElements.forEach(el => el.classList.remove("hidden"));
    } else {
      doblecloverElements.forEach(el => el.classList.remove("hidden"));
      dobleusoElements.forEach(el => el.classList.remove("hidden"));
    }
  });
}


