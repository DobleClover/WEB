export function changeCardImages() {
    const cardWithImages = document.querySelectorAll(".card_with_image");
  
    cardWithImages.forEach((card) => {
      const images = card.querySelectorAll(".card_image");
      let index = 0;
  
      if (images.length === 0) return; // Evita errores si no hay imágenes en el brand_card
  
      // ✅ Inicializar la primera imagen como activa
      images[index].classList.add("card_image_active");
  
      function changeImage() {
        images.forEach((img) => img.classList.remove("card_image_active")); // Ocultar todas
        index = (index + 1) % images.length; // Avanzar al siguiente índice
        images[index].classList.add("card_image_active"); // Mostrar la actual
  
        // Genera un nuevo intervalo aleatorio para la siguiente ejecución
        setTimeout(changeImage, getRandomInterval());
      }
  
      // Inicia la animación con un tiempo aleatorio
      setTimeout(changeImage, getRandomInterval());
    });
  }
function getRandomInterval() {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000; // Genera un número entre 4000 y 6000 ms
}
