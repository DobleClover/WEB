import { observeAndStartCardAnimations } from "./brandCard.js";
import {
  createBrandCard,
  createDropCard,
} from "./componentRenderer.js";
import {
  brandsFromDB,
  dropsFromDB,
  setBrands,
  setDrops,
} from "./fetchEntitiesFromDB.js";
import {
  animateSectionsOnce,
  removeDoblecloverOverlay,
  scriptInitiator,
} from "./utils.js";

window.addEventListener("load", async () => {
  try {
    const hero = document.querySelector(".hero");
    hero.style.backgroundImage = "url('/img/index.jpg')"; // Carga programática
    await scriptInitiator();
    await setBrands(true, true, true); //el segundo true es para que solo me busque el isotype, el tercero para las homebrands
    // Ocultar overlay
    removeDoblecloverOverlay();
    setTimeout(() => {
      hero.classList.add("show_overlay"); // Aparece el overlay
    }, 0); // Se muestra el overlay poco después de cargar la imagen

    // Después de un tiempo, mostramos el título
    setTimeout(() => {
      hero.classList.add("show_title"); // Muestra el título
    }, 250);

    // Luego de un pequeño retraso, mostramos los botones
    setTimeout(() => {
      hero.classList.add("show_buttons"); // Muestra los botones
    }, 450);

    

    const main = document.querySelector(".main");
    const brandCardWrapper = main.querySelector(".brand_card_wrapper");
    brandCardWrapper.innerHTML = "";
    brandsFromDB.forEach((brand) => {
      const card = createBrandCard(brand);
      brandCardWrapper.appendChild(card);
    });
    const brandSection = main.querySelector(".brand_cards_section");
    observeAndStartCardAnimations();
    await setDrops();
    // animateSectionElements(brandSection);
    const dropCardWrapper = main.querySelector(".drop_card_wrapper");
    dropCardWrapper.innerHTML = "";
    dropsFromDB.forEach((drop) => {
      const card = createDropCard(drop);
      dropCardWrapper.appendChild(card);
    });
    const dropSection = main.querySelector(".drop_cards_section");
    animateSectionsOnce();
    observeAndStartCardAnimations();
  } catch (error) {
    console.log(error);
    return;
  }
});
