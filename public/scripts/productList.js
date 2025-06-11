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
  animateBanners();
  // Primer render automático
  createPaginatedProductLoader({
    wrapperSelector: ".dobleclover_wrapper",
    buttonSelector: "#loadMoreDobleclover",
    queryBuilder: ({ offset, hasStock, limit }) =>
      `/api/product?is_dobleuso=0&has_stock=${hasStock}&limit=${limit}&offset=${offset}`,
    onInitialRender: animateSectionElements,
  });

  createPaginatedProductLoader({
    wrapperSelector: ".dobleuso_wrapper",
    buttonSelector: "#loadMoreDobleuso",
    queryBuilder: ({ offset, hasStock, limit }) =>
      `/api/product?is_dobleuso=1&has_stock=${hasStock}&limit=${limit}&offset=${offset}`,
    onInitialRender: animateSectionElements,
  });

  setupCustomFilters();
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

    const doblecloverElements = document.querySelectorAll(
      ".dobleclover_element"
    );
    const dobleusoElements = document.querySelectorAll(".dobleuso_element");

    if (value === "dobleclover") {
      doblecloverElements.forEach((el) => el.classList.remove("hidden"));
      dobleusoElements.forEach((el) => el.classList.add("hidden"));
    } else if (value === "dobleuso") {
      doblecloverElements.forEach((el) => el.classList.add("hidden"));
      dobleusoElements.forEach((el) => el.classList.remove("hidden"));
    } else {
      doblecloverElements.forEach((el) => el.classList.remove("hidden"));
      dobleusoElements.forEach((el) => el.classList.remove("hidden"));
    }
  });
}

function animateBanners() {
  document.querySelectorAll(".accordion_header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      const isOpen = content.classList.contains("open");

      // Cierra todos
      document
        .querySelectorAll(".accordion_content")
        .forEach((c) => c.classList.remove("open"));
      document
        .querySelectorAll(".accordion_header")
        .forEach((h) => h.classList.remove("open"));

      // Abre el actual si estaba cerrado
      if (!isOpen) {
        content.classList.add("open");
        header.classList.add("open");
      }
    });
  });
}
function setupCustomFilters() {
  const toggleBtn = document.querySelector(".filter_toggle_btn");
  const dropdown = document.querySelector(".custom_filter_dropdown");

  // Toggle principal
  toggleBtn.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  // Cerrar si clickeás fuera
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  // Listener checkboxes
  document
    .querySelectorAll('.filter_dropdown_content input[type="checkbox"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        applyFilters();
        updateFilterCount();
      });
    });

  // Toggle interno de categorías
  const categoryToggle = document.querySelector(".category_toggle");
  const categoryList = document.querySelector(".category_list");
  const categoryArrow = document.querySelector(".category_arrow");

  categoryToggle.addEventListener("click", () => {
    const isCollapsed = categoryList.classList.contains("collapsed");
    categoryList.classList.toggle("collapsed", !isCollapsed);
    categoryList.classList.toggle("expanded", isCollapsed);
    categoryArrow.style.transform = isCollapsed
      ? "rotate(45deg)"
      : "rotate(0deg)";
  });
  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Desmarcar todos los checkboxes
      document
        .querySelectorAll('.filter_dropdown_content input[type="checkbox"]')
        .forEach((el) => {
          el.checked = false;
        });

      // Reaplicar filtros
      applyFilters();
      updateFilterCount();
    });
  }
}

function applyFilters() {
  const selectedTypes = Array.from(
    document.querySelectorAll('input[name="type"]:checked')
  ).map((el) => el.value);
  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="category"]:checked')
  ).map((el) => el.value);

  // Ocultar todo lo que tenga clase *_element (productos, títulos, contenedores)
  const main = document.querySelector("main");
  const allTypeElements = main.querySelectorAll("[class*='_element']");

  allTypeElements.forEach((el) => el.classList.add("hidden"));

  // Mostrar los que coinciden con el tipo seleccionado
  if (selectedTypes.length === 0) {
    allTypeElements.forEach((el) => el.classList.remove("hidden"));
  } else {
    selectedTypes.forEach((type) => {
      document
        .querySelectorAll(`.${type}_element`)
        .forEach((el) => el.classList.remove("hidden"));
    });
  }

  // Filtrar productos por categoría (solo sobre los que ya están visibles por tipo)
  const products = document.querySelectorAll(".product_card");

  products.forEach((product) => {
    product.classList.remove("hidden"); // Asegurarse de reiniciar antes de evaluar categoría

    const categoryId = product.dataset.categories_id;
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(categoryId);

    if (!matchesCategory) {
      product.classList.add("hidden");
    }
  });
}

function updateFilterCount() {
  const count = document.querySelectorAll(
    '.filter_dropdown_content input[type="checkbox"]:checked'
  ).length;
  document.getElementById("filter_count").textContent = count;
}
