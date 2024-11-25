export function listenToProductCards() {
  const productCards = document.querySelectorAll(".product_card");
  productCards.forEach((card) => {
    if (card.dataset.listened) return;
    card.dataset.listened = true;
    const mainImage = card.querySelector(".card_main_image");
    const alternativeImage = card.querySelector(".card_alternative_image");
    const otherImages = card.querySelectorAll(".card_other_image img");
    if(!isInDesktop()){
      let timeoutID;
      //aca es mobile, me fijo si toca las other images
      otherImages.forEach(image => {
        image.addEventListener("click",(e)=>{
           // Evita que el <a> contenedor realice su acción predeterminada
          e.preventDefault();
          // Agarro el src
          const alternativeSrc = image.src;
          // Asigno el src a la imagen alternativa
          alternativeImage.src = alternativeSrc;

          // Agrego la clase "alternative_image_active"
          alternativeImage.classList.add("card_alternative_image_active");
            if(timeoutID)clearTimeout(timeoutID)
            // Después de 3 segundos, quito la clase
            timeoutID = setTimeout(() => {
              alternativeImage.classList.remove("card_alternative_image_active");
            }, 2500);
            })
      });
      return
    } else{
    // Lógica cuando isInDesktop() es true
    otherImages.forEach((image) => {
      image.addEventListener("mouseenter", () => {
        const relativeSrc = new URL(image.src).pathname;
        alternativeImage.src = relativeSrc;
        alternativeImage.classList.add("card_main_image_active");
        mainImage.classList.remove("card_main_image_active");
      });

      image.addEventListener("mouseleave", () => {
        alternativeImage.classList.remove("card_main_image_active");
        mainImage.classList.add("card_main_image_active");
      });
    });
    }
    
  });
}

// Se fija si esta en desktop
export function isInDesktop() {
  return window.innerWidth >= 1024; // Mobile & Tablet
}

//Se fija si esta en tanto % visto
export const isInViewport = (element, percentaje) => {
  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.top <= windowHeight * percentaje;
};
