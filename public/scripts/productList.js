import { createProductCard } from "./componentRenderer.js";
import { setSettings } from "./fetchEntitiesFromDB.js";
import { animateSectionElements, listenToProductCards, paintProductCardsInList, productsFromDB, scriptInitiator, setProductsFromDB } from "./utils.js";

window.addEventListener('load',async()=>{
    await scriptInitiator();
    bannerAnimation();
    // Animo los titulos
    const buttonsSection = document.querySelector('.product_list_buttons_container');
    setTimeout(()=>animateSectionElements(buttonsSection),500);
    await paintProductCardsInList();
})

function bannerAnimation(){
    const inner = document.querySelector(".rotator_inner");
    const items = document.querySelectorAll(".rotator_item");
    const totalItems = items.length;
  
    let currentIndex = 0;
  
    setInterval(() => {
      currentIndex = (currentIndex + 1) % totalItems;
      inner.style.transform = `translateX(-${currentIndex * 100}vw)`;
    }, 6000); // Cada 3 segundos
}