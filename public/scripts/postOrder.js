import { userLogged } from "./checkForUserLogged.js";
import { generatePostOrderCard } from "./componentRenderer.js";
import { deleteLocalStorageItem } from "./localStorage.js";
import { activateCopyMsg, copyElementValue, handleOrderInLocalStorage, isOnPage, scriptInitiator } from "./utils.js";
const postOrderExportObject = {
    pageConstructor: null,
}
window.addEventListener("load", async () => {
  try {
    if(!isOnPage('/post-compra'))return;
    // Aca dio ok el pago, doy de baja en localStorage
    handleOrderInLocalStorage({ type: 3 })
    await scriptInitiator();
    // Si no vino usuario loggeado, borro el cartItems
    if(!userLogged){
      deleteLocalStorageItem('cartItems')
    } else{
      userLogged.tempCartItems = [];
    }
    // Obtén el parámetro `order` de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderTraIdFromURL = urlParams.get("orderId");
    const orderShippingTypeIdFromURL = urlParams.get("shippingTypeId");
    const orderPaymentTypeIdFromURL = urlParams.get("paymentTypeId");
    
    
    postOrderExportObject.pageConstructor = function(){
        const main =  document.querySelector('.main');
        main.innerHTML = '';
        const orderCard = generatePostOrderCard(orderTraIdFromURL,orderShippingTypeIdFromURL,orderPaymentTypeIdFromURL);
        main.appendChild(orderCard);
        listenToCopyOrderNumberBtn();
    }
    function listenToCopyOrderNumberBtn() {
      const copyBtn = document.querySelector(".copy_order_number_btn");
      if (copyBtn.dataset.listened) return;
      copyBtn.dataset.listened = true;
      copyBtn.addEventListener("click", () => {
        const orderNumberP = document.querySelector(".card_order_number");
        copyElementValue(orderNumberP.textContent);
        activateCopyMsg();
      });
    }
    postOrderExportObject.pageConstructor();
  } catch (error) {
    return console.log(error);
  }
});

export {postOrderExportObject}
