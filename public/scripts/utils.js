export function listenToProductCards() {
  const productCards = document.querySelectorAll(".product_card");
  productCards.forEach((card) => {
    if (card.dataset.listened) return;
    card.dataset.listened = true;
    const mainImage = card.querySelector(".card_main_image");
    const hoveredImage = card.querySelector(".card_hovered_image");
    const otherImages = card.querySelectorAll(".card_other_image img");

    // Lógica cuando isInDesktop() es true
    otherImages.forEach((image) => {
      image.addEventListener("mouseenter", () => {
        const relativeSrc = new URL(image.src).pathname;
        hoveredImage.src = relativeSrc;
        hoveredImage.classList.add("card_main_image_active");
        mainImage.classList.remove("card_main_image_active");
      });

      image.addEventListener("mouseleave", () => {
        hoveredImage.classList.remove("card_main_image_active");
        mainImage.classList.add("card_main_image_active");
      });
    });
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
