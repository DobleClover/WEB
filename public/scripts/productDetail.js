import { createProductCard } from "./componentRenderer.js";
import {
  productsFromDB,
  setProductsFromDB,
  scrollToTop,
  generateRandomString,
  variationsFromDB,
  fetchDBProducts,
  minDecimalPlaces,
  displayBigNumbers,
  scriptInitiator,
  displayPriceNumber,
  formatStringForTextarea,
  animateSectionElements,
  getIdFromUrl,
} from "./utils.js";

let productDetailExportObj = {
  createProductDetailsSection: null,
  paintRelatedProductCards: null,
};
import {
  deleteLocalStorageItem,
  getLocalStorageItem,
  setLocalStorageItem,
} from "./localStorage.js";
import { userLogged } from "./checkForUserLogged.js";
import { checkCartItemsToPaintQuantity } from "./header.js";

let productId, variationSelected;

window.addEventListener("load", async () => {
  try {
    if (!window.location.pathname.includes("/producto/")) return;
    await scriptInitiator(); //Inicio userLogged y lo del lenguaje
    productDetailExportObj.createProductDetailsSection = function (
      productData
    ) {
      const breadcrumb = document.createElement("div");
      breadcrumb.className = "ui breadcrumb";
      breadcrumb.innerHTML = `
          <a class="section" href="/">Home</a>
          <div class="divider"> / </div>
          <a class="section" href="/tienda">Tienda</a>
          <div class="divider"> / </div>
          <a class="section" href="/marcas/${productData?.brand?.id}">${productData?.brand?.name}</a>
          <div class="divider"> / </div>
          <div class="active section">${productData?.name}</div>
      `;

      const productName = document.createElement("h1");
      productName.className = "product-name";
      productName.textContent = productData?.name;

      const productPrice = document.createElement("p");
      productPrice.className = `product_price`;
      const productHasDiscount = productData.discount > 0;
      productPrice.innerHTML = productHasDiscount
        ? `<span class="discounted_price">$${displayPriceNumber(
            productData.price
          )}</span> <span class="discounted_tag">${
            productData.discount
          }% OFF</span>`
        : `$${displayPriceNumber(productData.price)}`;
      let productRealPrice;
      if (productHasDiscount) {
        productRealPrice = document.createElement("p");
        productRealPrice.className = `product_price`;
        const productPriceWithDiscount = displayPriceNumber(productData.discounted_price);
        productRealPrice.innerHTML = `$${productPriceWithDiscount}`;
      }
      const productDescription = document.createElement("p");
      productDescription.className = "product_desc";
      productDescription.innerHTML = formatStringForTextarea(
        productData?.description
      );

      const selectsWrapper = document.createElement("div");
      selectsWrapper.className = "selects_wrapper";

      // Obtener tacos y talles únicos desde variations
      const colors = [
        ...new Map(
          productData?.variations.map((v) => [v.color.id, v.color])
        ).values(),
      ];
      const sizes = [
        ...new Map(
          productData?.variations.map((v) => [v.size.id, v.size])
        ).values(),
      ];

      // Crear select para colores
      const colorSelectContainer = document.createElement("div");
      colorSelectContainer.className = "select_container";
      const colorSelect = document.createElement("select");
      colorSelect.name = "colors_id";
      colorSelect.id = "colors_id";

      colorSelect.innerHTML = colors
        .map((color) => `<option value="${color.id}">${color.name}</option>`)
        .join("");

      colorSelectContainer.innerHTML = `
          <label for="colors_id">Color</label>
      `;
      colorSelectContainer.appendChild(colorSelect);

      // Crear select para talles
      const sizeSelectContainer = document.createElement("div");
      sizeSelectContainer.className = "select_container";
      const sizeSelect = document.createElement("select");
      sizeSelect.name = "sizes_id";
      sizeSelect.id = "sizes_id";

      sizeSelect.innerHTML = sizes
        .map((size) => `<option value="${size.id}">${size.size}</option>`)
        .join("");

      sizeSelectContainer.innerHTML = `
          <label for="sizes_id">Talle</label>
      `;
      sizeSelectContainer.appendChild(sizeSelect);

      selectsWrapper.appendChild(colorSelectContainer);
      selectsWrapper.appendChild(sizeSelectContainer);

      // Agregar comportamiento dinámico
      colorSelect.addEventListener("change", () => {
        updateSizeOptions(
          sizeSelect,
          productData?.variations,
          colorSelect.value
        );
        setVariationSelected();
      });
      sizeSelect.addEventListener("change", () => {
        setVariationSelected();
      });

      // Agregar todo al contenedor principal
      const productDetailsSection = document.querySelector(
        ".product_detail_section"
      );
      productDetailsSection.innerHTML = ""; //lo limpio
      if (productDetailsSection) {
        productDetailsSection.appendChild(breadcrumb);
        productDetailsSection.appendChild(productName);
        productDetailsSection.appendChild(productPrice);
        productHasDiscount &&
          productDetailsSection.appendChild(productRealPrice);
        productDetailsSection.appendChild(productDescription);
        productDetailsSection.appendChild(selectsWrapper);
        colorSelect.dispatchEvent(new Event("change")); //Lo pongo despues de agrear al dom
      }

      // Ahora como uktimo agrego el boton

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "button_container";
      if (productDetailsSection)
        productDetailsSection.appendChild(buttonContainer);
      paintAddToCartButton();
    };

    productId = getIdFromUrl(); //Obtengo el id del producto
    await setProductsFromDB({ id: productId }); //Seteo el producto

    const productFromDB = (productsFromDB?.length && productsFromDB[0]) || null;
    if (!productFromDB) return (window.location.href = "/tienda"); //Lo mando a la tienda si no encontro
    let productCategoryID = productFromDB?.category?.id;

    const relatedProducts = await fetchDBProducts({
      categoryId: productCategoryID,
      limit: 4,
    }); //Aca seteo los related
    document.title = `Tienda - ${productFromDB.name}`;
    // Una vez que esta despintp y pinto
    // hidePlaceHolders();
    createImagesContainer(productFromDB?.files);
    checkForImageClick();
    productDetailExportObj.paintRelatedProductCards = function () {
      let relatedProductCardWrapper = document.querySelector(
        ".related_products_section .product_cards_wrapper"
      );
      relatedProductCardWrapper.innerHTML = "";
      let productsToPaint = [...relatedProducts];

      // Filtrar el array para excluir el producto con el mismo id y devuelve solo los primeros 3 elementos
      productsToPaint = productsToPaint
        .filter((product) => product.id !== productId)
        .slice(0, 3);
      productsToPaint.forEach((prod) => {
        let cardElement = createProductCard(prod);
        relatedProductCardWrapper.appendChild(cardElement);
      });
      //   una vez lo pinto, agrego las aniamciones
      relatedProductCardWrapper = document.querySelector(
        ".related_products_section .product_cards_wrapper"
      );
      animateSectionElements(relatedProductCardWrapper, 0.1);
    };
    productDetailExportObj.createProductDetailsSection(productFromDB);
    relatedProducts.length && productDetailExportObj.paintRelatedProductCards(); //Pinto los related
    scrollToTop();
    //Hago el pedido al fetch de 4 productos y filtrar 3

    
    function createImagesContainer(productFiles) {
      const imagesWrapper = document.createElement("div");
      imagesWrapper.className = "images_wrapper";

      const smallImagesContainer = document.createElement("div");
      smallImagesContainer.className = "small_images_container";

      productFiles.forEach((file, index) => {
        // Crear imagen grande
        const largeImage = document.createElement("img");
        largeImage.srcset = file.file_urls
          .map((url) => `${url.url} ${url.size}`)
          .join(", ");
        largeImage.src = file.file_urls[file.file_urls.length - 1].url;
        largeImage.alt = file.filename;
        largeImage.className = `image_element ${
          index === 0 ? "image_element-active" : ""
        }`;
        largeImage.setAttribute("data-file_id", file.id);
        largeImage.loading = "lazy";
        imagesWrapper.appendChild(largeImage);

        if (productFiles.length > 1) {
          // Crear imagen pequeña
          const smallImage = document.createElement("img");
          smallImage.srcset = file.file_urls
            .map((url) => `${url.url} ${url.size}`)
            .join(", ");
          smallImage.src = file.file_urls[file.file_urls.length - 1].url;
          smallImage.alt = file.filename;
          smallImage.className = "small_image_element";
          smallImage.setAttribute("data-file_id", file.id);
          smallImage.loading = "lazy";
          smallImagesContainer.appendChild(smallImage);
        }
      });

      // Asegurar que el contenedor comience en la primera imagen
      setTimeout(() => {
        if (imagesWrapper.firstChild) {
          imagesWrapper.firstChild.scrollIntoView({
            behavior: "auto", // Cambiar a "smooth" si deseas animación
            block: "nearest",
            inline: "start",
          });
        }
      }, 0);

      // Agregar a la sección product_images_section
      const productImagesSection = document.querySelector(
        ".product_images_section"
      );
      productImagesSection.innerHTML = ""; //lo limpio
      if (productImagesSection) {
        productImagesSection.appendChild(imagesWrapper);
        productImagesSection.appendChild(smallImagesContainer);
      }
    }

    // Función para actualizar las opciones de talles
    function updateSizeOptions(sizeSelect, variations, selectedColorId) {
      const availableSizes = variations
        .filter((v) => v.color.id == selectedColorId)
        .map((v) => v.size);
      const uniqueSizes = [
        ...new Map(availableSizes.map((size) => [size.id, size])).values(),
      ];

      sizeSelect.innerHTML = uniqueSizes
        .map((size) => `<option value="${size.id}">${size.size}</option>`)
        .join("");
    }

    //Se fija y setea la imagen principal
    function checkForImageClick() {
      const smallImages = Array.from(
        document.querySelectorAll(".small_image_element")
      );
      const bigImages = Array.from(document.querySelectorAll(".image_element"));
      const bigActiveImage = document.querySelector(
        ".image_element.image_element-active"
      );

      smallImages.forEach((img, index) => {
        img.addEventListener("click", () => {
          // Obtener la bigImage correspondiente
          const correspondingBigImage = bigImages[index];
          // Verificar si ya está activa
          if (
            correspondingBigImage.classList.contains("image_element-active")
          ) {
            return; // Salir si es la misma imagen activa
          }

          // Remover la clase active de la imagen actual
          bigImages.forEach((image) =>
            image.classList.remove("image_element-active")
          );

          // Agregar la clase active a la nueva imagen seleccionada
          correspondingBigImage.classList.add("image_element-active");
        });
      });
    }
    async function handleAddProductToCart() {
      const cartObject = {
        variations_id: variationSelected.id,
        quantity: 1,
      };

      if (userLogged !== null) {
        cartObject.users_id = userLogged.id;
        let response = await fetch(`/api/cart/${userLogged.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartObject),
        });
        if (response.ok) {
          userLogged.tempCartItems?.push(cartObject);
        }
      } else {
        //Aca seteo un cartItemID para aca
        cartObject.id = generateRandomString(10);
        setLocalStorageItem("cartItems", cartObject, true);
      }
      checkCartItemsToPaintQuantity();
      // Antes de retornar pinto nuevamente el boton
      paintAddToCartButton();
      return;
    }
    async function checkForAddToCartBtnClicks() {
      const addToCartBtn = document.querySelector(".add_to_cart_btn");
      addToCartBtn.addEventListener("click", async () => {
        addToCartBtn.classList.add("loading");
        await handleAddProductToCart(addToCartBtn);
        addToCartBtn.classList.remove("loading");
      });
    }
    function checkForVariationStock() {
      return variationSelected.quantity > 0;
    }
    function checkForProductInCart() {
      let cartItems;
      if (!userLogged) {
        cartItems = getLocalStorageItem("cartItems") || [];
      } else {
        cartItems = userLogged.tempCartItems || [];
      }

      const variationIsInCartIndex = cartItems.findIndex(
        (item) => item.variations_id == variationSelected.id
      );
      if (variationIsInCartIndex < 0) return false;
      return true;
    }
    //
    function setVariationSelected() {
      const colorSelect = document.querySelector('select[name="colors_id"]');
      const sizeSelect = document.querySelector('select[name="sizes_id"]');

      const productVariations = productFromDB.variations;
      variationSelected = productVariations.find(
        (variation) =>
          variation.color.id == colorSelect.value &&
          variation.size.id == sizeSelect.value
      );
      paintAddToCartButton(); //Pinta el boton
    }
    //Pinta el boton dependiendo si la variacion elegida esta o no en el carro
    function paintAddToCartButton() {
      const button = document.querySelector(".button_container");
      if (!button) return;
      const variationHasStock = checkForVariationStock();
      if (!variationHasStock) {
        const buttonText = "Producto sin stock";
        button.innerHTML = `
          <button class="ui button green basic add_to_cart_btn disabled" type="button">${buttonText}</button>
      `;
        return;
      }

      const productAlreadyInCart = checkForProductInCart(); //Se fija si la variacion ya esta en el carro
      const buttonText = productAlreadyInCart
        ? "Agregado al carro"
        : "Agregar al carrito";
      button.innerHTML = `
          <button class="ui button green add_to_cart_btn ${
            productAlreadyInCart ? "disabled" : ""
          }" type="button">${buttonText}</button>
      `;
      checkForAddToCartBtnClicks();
    }
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
});

export { productDetailExportObj };
