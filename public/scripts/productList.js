import { createProductCard } from "./componentRenderer.js";
import { setSettings } from "./fetchEntitiesFromDB.js";
import { animateSectionElements, listenToProductCards, paintProductCardsInList, productsFromDB, scriptInitiator, setProductsFromDB } from "./utils.js";

window.addEventListener('load',async()=>{
    await scriptInitiator();
    // Animo los titulos
    const buttonsSection = document.querySelector('.product_list_buttons_container');
    setTimeout(()=>animateSectionElements(buttonsSection),500);
    await paintProductCardsInList();
})