// helpers/paginationLoader.js

import { paintProductCardsInList } from "../utils.js";

export function createPaginatedProductLoader({
  wrapperSelector,
  buttonSelector,
  queryBuilder,
  isDobleUso = false,
  onInitialRender = null,
  limit = 5,
}) {
  let offset = 0;
  let fetchingWithoutStock = false;

  const wrapper = document.querySelector(wrapperSelector);
  const loadMoreBtn = document.querySelector(buttonSelector);

  async function loadProducts(initialLoad = false) {
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "Cargando...";
    }

    const hasStockParam = fetchingWithoutStock ? 0 : 1;
    const url = queryBuilder({ offset, hasStock: hasStockParam, limit });

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) throw new Error("Error fetching products");

      const products = data.data;

      if (products.length > 0) {
        await paintProductCardsInList(products, wrapper, true);

        offset += products.length;

        if (initialLoad && typeof onInitialRender === "function") {
          onInitialRender(wrapper);
        }

        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Cargar más productos";
        }
      } else if (!fetchingWithoutStock) {
        fetchingWithoutStock = true;
        offset = 0;
        return await loadProducts(initialLoad);
      } else {
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
      }
    } catch (err) {
      console.error("Error loading products:", err);
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Error al cargar";
      }
    }
  }

  loadMoreBtn?.addEventListener("click", () => loadProducts());
  loadProducts(true);
}
