export function observeAndStartCardAnimations() {
  const cards = document.querySelectorAll(".card_with_image");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;

          // Evita que se vuelva a iniciar varias veces
          if (!card.dataset.animationStarted) {
            card.dataset.animationStarted = "true";
            startCardImageAnimation(card);
          }
        }
      });
    },
    {
      threshold: 0.5, // Se dispara cuando al menos el 50% del card está visible
    }
  );

  cards.forEach((card) => observer.observe(card));
}

function startCardImageAnimation(card) {
  const images = card.querySelectorAll(".card_image");
  let index = 0;

  if (images.length === 0) return;

  // Asegurar que la primera imagen esté activa
  images[index].classList.add("card_image_active");

  function changeImage() {
    images.forEach((img) => img.classList.remove("card_image_active"));
    index = (index + 1) % images.length;
    images[index].classList.add("card_image_active");

    setTimeout(changeImage, getRandomInterval());
  }

  setTimeout(changeImage, getRandomInterval());
}

function getRandomInterval() {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000;
}

