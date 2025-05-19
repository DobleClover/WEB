import { createProductCard } from "./componentRenderer.js";
import { setSettings } from "./fetchEntitiesFromDB.js";
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
  loadMoreProducts({ isDobleUso: false, initialLoad: true });
  loadMoreProducts({ isDobleUso: true, initialLoad: true });
  listenToFilterSelect();
  listenToLoadMoreBtns();
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

let productsDobleClover = [];
let productsDobleUso = [];

let offsetDobleClover = 0;
let offsetDobleUso = 0;

const limitPerLoad = 5;


async function loadMoreProducts({ isDobleUso = false, initialLoad = false }) {
  const offset = isDobleUso ? offsetDobleUso : offsetDobleClover;
  const wrapper = document.querySelector(isDobleUso ? ".dobleuso_wrapper" : ".dobleclover_wrapper");
  const loadMoreBtn = document.getElementById(isDobleUso ? "loadMoreDobleuso" : "loadMoreDobleclover");

  // Feedback visual
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Cargando...";
  }

  try {
    const res = await fetch(`/api/product?is_dobleuso=${isDobleUso ? 1 : 0}&limit=${limitPerLoad}&offset=${offset}`);
    const data = await res.json();
    if (!data.ok) throw new Error("Error fetching products");

    const newProducts = data.data;

    // Guardar productos
    if (isDobleUso) {
      productsDobleUso.push(...newProducts);
      offsetDobleUso += newProducts.length;
    } else {
      productsDobleClover.push(...newProducts);
      offsetDobleClover += newProducts.length;
    }

    // Pintar productos
    await paintProductCardsInList(newProducts,wrapper,true)
    
    // Mostrar u ocultar el botón
    if (!data.hasMore || newProducts.length === 0) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Cargar más productos";
    }

    // Animación al cargar los primeros
    if (initialLoad && newProducts.length > 0) {
      animateSectionElements(wrapper, 0.05);
    }
  } catch (err) {
    console.error("Error loading products:", err);
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Error al cargar";
    }
  }
}


function listenToLoadMoreBtns(){
  // Botones
  document.getElementById("loadMoreDobleclover").addEventListener("click", () => {
    loadMoreProducts({ isDobleUso: false });
  });
  document.getElementById("loadMoreDobleuso").addEventListener("click", () => {
    loadMoreProducts({ isDobleUso: true });
  });
}
