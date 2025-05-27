import { paintProductCardsInList, removeDoblecloverOverlay, scriptInitiator } from "./utils.js";

window.addEventListener("load", async () => {
  try {
    await scriptInitiator();
    const brand = await getBrand();
    // Ocultar loader al terminar
    removeDoblecloverOverlay()
    renderBrandSections(brand);
    await paintProductCardsInList(brand.products);
    
  } catch (error) {
    console.error("Error al cargar la marca:", error);
    // Mostrar mensaje al usuario si querés
    return console.log(error);
  }
});

const getBrand = async () => {
  // 1. Obtener el ID de la marca desde la URL
  const url = new URL(window.location.href);
  const brandsId = url.pathname.split("/").pop(); // último segmento

  // 2. Hacer el fetch a tu endpoint
  const response = await fetch(
    `/api/brand/?brands_id=${brandsId}&withImages=true&withProductImages=true`
  );

  if (!response.ok) {
    throw new Error("Error al obtener la marca: " + response.statusText);
  }

  // 3. Convertir la respuesta a JSON
  const brandData = await response.json();
  return brandData.data
};

function renderBrandSections(brand) {
    const bannerSection = document.querySelector(".brand_banner_section");
    const productSection = document.querySelector(".product_cards_wrapper_section");
  
    // Obtener logo principal y logotipo
    const logoUrl = brand.logo?.file_urls?.find(f => f.size === "1x")?.url;
    const logotypeUrl = brand.logotype?.file_urls?.find(f => f.size === "1x")?.url;
  
    // Banner con logo centrado
    if (logotypeUrl) {
      const img = document.createElement("img");
      img.src = logotypeUrl;
      img.alt = `${brand.name} logo`;
      img.classList.add("brand_logo");
      bannerSection.appendChild(img);
    }
  
    // // Trama de fondo con logotipo
    // if (logoUrl) {
    //   productSection.style.backgroundImage = `url("${logoUrl}")`;
    // }
  }
  