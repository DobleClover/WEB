import { scriptInitiator } from "./utils.js";

window.addEventListener("load", async () => {
  try {
    await scriptInitiator();
    const images = document.querySelectorAll(".about_us_image.slideshow img");
    let currentIndex = 0;

    if (images.length === 0) return;

    images[currentIndex].classList.add("active");

    setInterval(() => {
      images[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].classList.add("active");
    }, 6000);
  } catch (error) {
    return console.log(error);
    
  }
});
