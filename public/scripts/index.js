import { changeCardImages } from "./brandCard.js";
import {
  createBrandCard,
  createDropCard,
  createProductCard,
} from "./componentRenderer.js";
import {
  brandsFromDB,
  dropsFromDB,
  setBrands,
  setDrops,
} from "./fetchEntitiesFromDB.js";
import {
  animateElement,
  animateSectionElements,
  animateSectionsOnce,
  checkIfIsInScreen,
  listenToProductCards,
  scriptInitiator,
} from "./utils.js";

window.addEventListener("load", async () => {
  try {
    await scriptInitiator();
    await setBrands(true);
    const hero = document.querySelector(".hero");
    setTimeout(() => {
      hero.classList.add("show_overlay"); // Aparece el overlay
    }, 150); // Se muestra el overlay poco después de cargar la imagen
  
    // Después de un tiempo, mostramos el título
    setTimeout(() => {
      hero.classList.add("show_title"); // Muestra el título
    }, 450);
  
    // Luego de un pequeño retraso, mostramos los botones
    setTimeout(() => {
      hero.classList.add("show_buttons"); // Muestra los botones
    }, 750);

    await setDrops();

    const main = document.querySelector(".main");
    const brandCardWrapper = main.querySelector(".brand_card_wrapper");
    brandCardWrapper.innerHTML = "";
    brandsFromDB.forEach((brand) => {
      const card = createBrandCard(brand);
      brandCardWrapper.appendChild(card);
    });
    const brandSection = main.querySelector(".brand_cards_section");
    // animateSectionElements(brandSection);
    const dropCardWrapper = main.querySelector(".drop_card_wrapper");
    dropCardWrapper.innerHTML = "";
    dropsFromDB.forEach((drop) => {
      const card = createDropCard(drop);
      dropCardWrapper.appendChild(card);
    });
    const dropSection = main.querySelector(".drop_cards_section");
    animateSectionsOnce();
    changeCardImages();
  } catch (error) {
    console.log(error);
    return;
  }
});


