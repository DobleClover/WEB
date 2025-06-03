import { sortProductsByStockAndType } from "./helpers/productSortUtils.js";
import {
  animateSectionElements,
  getIdFromUrl,
  paintProductCardsInList,
  removeDoblecloverOverlay,
  scriptInitiator,
} from "./utils.js";

window.addEventListener("load", async () => {
  try {
    await scriptInitiator();
    // Para que las fotos vayan pasando
    const images = document.querySelectorAll(".background_image");
    let currentIndex = 1;
    let intervalTime = 7500;
    function changeImage() {
      // Quitamos la clase background_image_active de la imagen actual
      images.forEach((img) => {
        img.classList.remove("background_image_active");
      });
      const image = images[currentIndex];
      // Calculamos el índice de la siguiente imagen
      currentIndex = (currentIndex + 1) % images.length;
      // Agregamos la clase background_image_active a la siguiente imagen
      image.classList.add("background_image_active");
    }

    // Logica para mostrar el thumb y las imagenes de manera limpia
    const mainImage = images[0];
    if (mainImage?.complete) {
      mainImage.classList.add("background_image_active");
      setInterval(changeImage, intervalTime);
      setTimeout(
        () => animateSectionElements(carrouselTextWrapperContainer, 0.1),
        700
      );
    }
    {
      mainImage?.addEventListener("load", () => {
        mainImage.classList.add("background_image_active");
        setInterval(changeImage, intervalTime);
        setTimeout(
          () => animateSectionElements(carrouselTextWrapperContainer, 0.1),
          700
        );
      });
    }

    const carrouselTextWrapperContainer = document.querySelector(
      ".text_wrapper_container"
    );
    const dropId = getIdFromUrl();
    const productsFromDrop = await fetchDropProducts(dropId);
    if (productsFromDrop.length) {
      const sorted = sortProductsByStockAndType(productsFromDrop);
      await paintProductCardsInList(sorted);
    } else {
      // TODO: Pintar que no hay productos
    }
    removeDoblecloverOverlay();
  } catch (error) {
    return console.log(error);
  }
});

export async function fetchDropProducts(id) {
  const url = `${window.location.origin}/api/drop/${id}/products`;

  return (await (await fetch(url)).json()).data || [];
}
