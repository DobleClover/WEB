// import { cartExportObj } from "./cart.js";
import { checkForUserLogged, userLogged } from "./checkForUserLogged.js";
import {
  closeModal,
  createAddressModal,
  createPhoneModal,
  createUserSignUpModal,
  disableAddressModal,
  disablePhoneModal,
  generateTooltip,
} from "./componentRenderer.js";
import {
  brandsFromDB,
  colorsFromDB,
  countriesFromDB,
  dropsFromDB,
  settingsFromDB,
  sizesFromDB,
} from "./fetchEntitiesFromDB.js";
import { checkCartItemsToPaintQuantity, headerExportObject } from "./header.js";
// import { checkCartItemsToPaintQuantity, headerExportObject } from "./header.js";
import {
  deleteLocalStorageItem,
  getLocalStorageItem,
  setLocalStorageItem,
} from "./localStorage.js";
import { userProfileExportObj } from "./userProfile.js";
// import { userProfileExportObj } from "./userProfile.js";

export function listenToProductCards() {
  const productCards = document.querySelectorAll(".product_card");
  productCards.forEach((card) => {
    if (card.dataset.listened) return;
    card.dataset.listened = true;
    const mainImage = card.querySelector(".card_main_image");
    const alternativeImage = card.querySelector(".card_alternative_image");
    const otherImages = card.querySelectorAll(".card_other_image img");
    if (!isInDesktop()) {
      let timeoutID;
      //aca es mobile, me fijo si toca las other images
      otherImages.forEach((image) => {
        image.addEventListener("click", (e) => {
          // Evita que el <a> contenedor realice su acción predeterminada
          e.preventDefault();
          // Agarro el src
          const alternativeSrc = image.src;
          // Asigno el src a la imagen alternativa
          alternativeImage.src = alternativeSrc;

          // Agrego la clase "alternative_image_active"
          alternativeImage.classList.add("card_alternative_image_active");
          if (timeoutID) clearTimeout(timeoutID);
          // Después de 3 segundos, quito la clase
          timeoutID = setTimeout(() => {
            alternativeImage.classList.remove("card_alternative_image_active");
          }, 2500);
        });
      });
      return;
    } else {
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

export function handleUserSignUpClick() {
  createUserSignUpModal();
  handlePageModal(true);
  const passwordRequirements = [];
  passwordRequirements.push("Longitud Minima: 8 Caracteres");
  passwordRequirements.push("Al menos 1 mayuscula");
  const passwordTooltip = generateTooltip(passwordRequirements);
  const passwordField = document.querySelector(
    ".ui.modal .password-field label"
  );
  passwordField.appendChild(passwordTooltip);
  // Inicializar el popup de Semantic UI con soporte para HTML
  $(".tooltip-icon").popup({
    popup: $(".tooltip-content"),
    on: "hover",
    hoverable: true,
    position: "left center", // Mueve el tooltip a la izquierda
  });
}

//Esto maneja todos los post que se hacen en un modal, para ver los parametros en cart.js se invoca
export async function handleModalCreation({
  entityType,
  buildBodyData,
  saveGuestEntity,
  updateElements,
  postToDatabase,
  validateFormFunction,
  method,
}) {
  try {
    const modal = document.querySelector(".ui.modal");
    const submitButton = document.querySelector(
      ".ui.modal .send-modal-form-btn"
    );
    const form = document.querySelector(".ui.form");
    if (!submitButton || !form) {
      throw new Error(`Form or submit button not found for ${entityType}`);
    }
    let formIsOK = handleModalCheckForComplete();
    if (!formIsOK) return;
    if (validateFormFunction) formIsOK = validateFormFunction(form);
    if (!formIsOK) return;
    //ACa sigo, pinto loading el boton
    submitButton.classList.add("loading");
    // Armo el bodyData con lo que viene de parametro
    // Construir el bodyData con la función personalizada
    const bodyData = buildBodyData(form);
    if (method == "PUT") {
      if (bodyData instanceof FormData) {
        bodyData.set("id", modal.dataset.db_id); // Si es FormData, usa .set()
      } else {
        bodyData.id = modal.dataset.db_id; // Si es un objeto normal, asigna directamente
      }
    }
    if (entityType == "user") {
      let modalResponse = true; //Esto es para no cerrar el modal si da incorrecto
      //Aca es para los forms de user
      if (postToDatabase) {
        try {
          modalResponse = await postToDatabase(bodyData, method);
        } catch (error) {
          console.error(`Error posting ${entityType} to database`, error);
          submitButton.classList.remove("loading");
          return;
        }
      }
      submitButton.classList.remove("loading");
      // Cierro el modal
      if (modalResponse) handlePageModal(false);
      if (updateElements) {
        //Ahora deberia actualizar dependiendo donde este
        await updateElements();
      }
      return;
    }
    let fetchResponse = true;
    if (userLogged) {
      //Aca esta loggeado, lo creo en db
      bodyData.users_id = userLogged.id;
      if (postToDatabase) {
        try {
          fetchResponse = await postToDatabase(bodyData, method);
          submitButton.classList.remove("loading");
        } catch (error) {
          console.error(`Error posting ${entityType} to database`, error);
          submitButton.classList.remove("loading");
          return;
        }
      }
    } else {
      //Aca es un guest, lo creo en session
      // Invitado: guardar en sessionStorage
      saveGuestEntity(bodyData);
    }
    // Si dio true el fetch, o no habia usuario
    if (fetchResponse) {
      // Cierro el modal
      handlePageModal(false);
      if (updateElements) {
        if (userLogged && (entityType == "address" || entityType == "phone")) {
          //Aca me fijo si marco default y lo hago "Manual"
          if (bodyData.defaultAddress) {
            //ACa se que activo el default de la direc, cambio el de todos
            userLogged.addresses.forEach(
              (dbAddress) =>
                (dbAddress.default =
                  dbAddress.id == bodyData?.id ? true : false)
            );
            //Esto es porque si es post no llega bodyData.id, entonces deschequea todos
            if (method == "POST")
              userLogged.addresses[
                userLogged.addresses.length - 1
              ].default = true;
          } else if (bodyData.defaultPhone) {
            //aca se que activo el default del phone, hago lo mismo
            userLogged.phones.forEach(
              (dbPhone) =>
                (dbPhone.default = dbPhone.id == bodyData?.id ? true : false)
            );
            //Esto es porque si es post no llega bodyData.id, entonces deschequea todos
            if (method == "POST")
              userLogged.phones[userLogged.phones.length - 1].default = true;
          }
        }
        //Ahora deberia actualizar dependiendo donde este
        await updateElements();
      }
    }

    return;
  } catch (error) {
    console.log("FALLE");
    return console.log(error);
  }
}

// crea y abre los modals
export function handlePageModal(boolean) {
  if (boolean) {
    //Abro el popup
    $(".ui.modal").modal({
      keyboardShortcuts: false,
      observeChanges: true,
      centered: false,
    });
    $(".ui.modal").modal("show");
    // document.body.classList.add("scrolling");
    return;
  }
  // Aca lo cierro
  closeModal();
  return;
}

export function toggleInputPasswordType(event) {
  if (!event) return;
  const input = event.target?.closest(".icon.input")?.querySelector("input");
  if (!event.target?.classList?.contains("slash")) {
    //Aca muestro la contrasena
    input.type = "text";
    event.target?.classList.add("slash");
    return;
  }
  //Aca ocultto la contrasena
  input.type = "password";
  event.target?.classList?.remove("slash");
  return;
}

// Se fija que el modal este completo
export function handleModalCheckForComplete() {
  const submitButton = document.querySelector(".ui.modal .send-modal-form-btn");
  const errorsContainer = document.querySelector(".ui.error.message");
  const modalForm = document.querySelector(".ui.form");
  modalForm.classList.remove("error"); // le saco el error
  // Pongo el botton normal
  submitButton.classList.remove("red"); //Lo dejo basic antes
  submitButton.classList.add("green"); //Lo dejo basic antes
  let formIsComplete = checkForAllModalRequiredFields();
  if (!formIsComplete) {
    submitButton.classList.add("red"); //Lo dejo full rojo
    submitButton.classList.remove("green"); //Lo dejo full rojo
    modalForm.classList.add("error"); //Le agrego el rojo
    errorsContainer.innerHTML = `<p>Debes completar todos los campos requeridos</p>`;
    return false;
  }
  return true;
}

function checkForAllModalRequiredFields() {
  const modalRequiredFields = document.querySelectorAll(
    ".ui.modal input[required], .ui.modal select[required], .ui.modal textarea[required]"
  );
  let flag = true;
  modalRequiredFields.forEach((element) => {
    let field = element.closest(".field");
    field.classList.remove("error");
    if (!element.value) {
      flag = false;
      field.classList.add("error");
    }
    //De paso le agrego si no tiene el listened un event change para sacarle la clase
    if (!element.dataset.listened) {
      element.dataset.listened = true;
      element.addEventListener("input", (e) => {
        let field = element.closest(".field");
        e.target.value
          ? field.classList.remove("error")
          : field.classList.add("error");
      });
    }
  });
  return flag;
}

//Pinta la tarjeta de succes/error
export function showCardMessage(isPositive, messageText) {
  // Seleccionar el contenedor padre
  const messageContainer = document.querySelector(".view_message_container");

  if (!messageContainer) {
    console.error("Contenedor principal no encontrado");
    return;
  }

  // Seleccionar los mensajes positivo y negativo
  const positiveMessage = messageContainer.querySelector(
    ".ui.positive.huge.message"
  );
  const negativeMessage = messageContainer.querySelector(
    ".ui.negative.huge.message"
  );

  if (!positiveMessage || !negativeMessage) {
    console.error("Mensajes positivo o negativo no encontrados");
    return;
  }

  // Ocultar ambos mensajes inicialmente
  positiveMessage.classList.add("hidden");
  negativeMessage.classList.add("hidden");

  // Mostrar el mensaje correspondiente
  const messageToShow = isPositive ? positiveMessage : negativeMessage;
  messageToShow.querySelector(".header").textContent = messageText || "";
  messageToShow.classList.remove("hidden");
  // Volver a ocultarlo después de 2 segundos
  setTimeout(() => {
    messageToShow.classList.add("hidden");
  }, 2000);
}

export function activateAccordions() {
  $(".ui.accordion").accordion(); // Activa los acordeones
}
export function initiateMenuBtn() {
  // Logica para boton + mobile
  $(".ui.dropdown.user_menu_btn").dropdown({
    direction: "upward",
    keepOnScreen: true,
    context: window,
  });
}
// Logica para que todos los inputs numericos no acepten letras
export function checkForNumericInputs() {
  let numericInputs = document.querySelectorAll(".numeric_only_input");
  numericInputs.forEach((input) => {
    if (input.dataset.listened) return;
    input.dataset.listened = true;
    // Tomo el ultimo valor
    let lastInputValue = input.value;
    input.addEventListener("input", function (e) {
      var inputValueArray = e.target.value.split("");
      let flag = true;
      //Esto es para que me permita poner espacios
      inputValueArray.forEach((value) => {
        if (!isNumber(value) && value != " ") flag = false;
      });

      if (!flag) {
        // Si no es un número, borra el contenido del campo
        e.target.value = lastInputValue;
      } else {
        lastInputValue = e.target.value; // Almacenar el último valor válido
      }
    });
  });
}

// Logica para todos los inputs float
export function checkForFloatInputs() {
  let floatInputs = document.querySelectorAll(".float_only_input");
  floatInputs.forEach((input) => {
    if (input.dataset.listened) return;
    input.dataset.listened = true;
    // Tomo el ultimo valor
    let lastInputValue = input.value;
    input.addEventListener("input", function (e) {
      var inputValue = e.target.value;
      // Reemplazar ',' por '.'
      inputValue = inputValue.replace(",", ".");
      if (!isFloat(inputValue)) {
        // Si no es un número, borra el contenido del campo
        e.target.value = lastInputValue;
      } else {
        // Actualizar el campo con el valor modificado
        e.target.value = inputValue;
        lastInputValue = inputValue; // Almacenar el último valor válido
      }
    });
  });
}

export function checkForAutoselectInputs() {
  // Seleccionamos todos los inputs con la clase "auto-select"
  const inputs = document.querySelectorAll(".auto_select_input");

  inputs.forEach((input) => {
    if (input.dataset.select_listened) return;
    input.dataset.select_listened = true;
    input.addEventListener("focus", function () {
      this.select(); // Selecciona el contenido cuando el input recibe foco
    });

  });
}
// Devuelve true si es todo numerico el valor
export function isNumber(value) {
  return /^[0-9]*$/.test(value);
}
// Devuelve true si es todo numerico el valor
export function isFloat(value) {
  return /^[0-9]*\.?[0-9]*$/.test(value);
}

//Toglea las classes del overlay
export const toggleOverlay = () => {
  const overlay = document.querySelector(".overlay");
  overlay.classList.toggle("overlay-active");
};

export const toggleBodyScrollableBehavior = () => {
  const body = document.querySelector("body");
  body.classList.toggle("non-scrollable");
};

export function generateRandomString(length) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

export let productsFromDB = [];
export async function setProductsFromDB({
  categoryId = null,
  limit = null,
  offset = null,
  id = null,
} = {}) {
  try {
    const fetchedArray = await fetchDBProducts({
      categoryId,
      limit,
      offset,
      id,
    });

    productsFromDB = fetchedArray;
  } catch (error) {
    console.log(`Falle en setProductsFromDB:`);
    return console.log(error);
  }
}

export async function fetchDBProducts({
  categoryId = null,
  limit = null,
  offset = null,
  id = null,
} = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (categoryId) queryParams.append("categoryId", categoryId);
    if (limit) queryParams.append("limit", limit);
    if (offset) queryParams.append("offset", offset);
    // Agregar los valores del array `id` a los parámetros de la query
    if (Array.isArray(id)) {
      id.forEach((value) => queryParams.append("productId", value));
    } else if (id) {
      queryParams.append("productId", id);
    }
    const url = `${
      window.location.origin
    }/api/product?${queryParams.toString()}`;

    let array = (await (await fetch(url)).json()).data || [];

    return array;
  } catch (error) {
    console.log(`Falle en fetchDBProducts`);
    return console.log(error);
  }
}

export let ordersFromDB = [];
export const setOrdersFromDB = async () => {
  const response = await fetch("/api/order");
  const data = await response.json();
  ordersFromDB = data.orders;
};

export let variationsFromDB = [];
export async function setVariationsFromDB(id) {
  try {
    const queryParams = new URLSearchParams();
    // Agregar los valores del array `id` a los parámetros de la query
    if (Array.isArray(id)) {
      id.forEach((value) => queryParams.append("variationId", value));
    } else if (id) {
      queryParams.append("variationId", id);
    }
    const url = `${
      window.location.origin
    }/api/variation?${queryParams.toString()}`;

    let array = (await (await fetch(url)).json()).data || [];
    variationsFromDB = array;
  } catch (error) {
    console.log(`Falle en setVariationsFromDB: ${error}`);
  }
}

//busca y pinta el primer loader de un contenedor
export function activateContainerLoader(cont, boolean) {
  const loaderToPaint = cont.querySelector(".ui.dimmer");
  if (!loaderToPaint) return;
  if (boolean) return loaderToPaint.classList.add("active");
  return loaderToPaint.classList.remove("active");
}

export function activateDropdown({ className, array, placeHolder, values }) {
  $(className)?.each(function () {
    let search = $(this);
    if (array?.length) {
      // Reemplazar el select por uno nuevo vacío
      // Crear un nuevo elemento <select>
      const newSelect = $("<select>");

      // Copiar las clases
      newSelect.attr("class", search.attr("class"));

      // Copiar el nombre
      newSelect.attr("name", search.attr("name"));

      // Copiar otros atributos estándar
      if (search.attr("multiple") !== undefined) {
        newSelect.attr("multiple", "");
      }
      if (search.attr("required") !== undefined) {
        newSelect.attr("required", "");
      }

      // Copiar todos los data-* attributes
      $.each(search.data(), (key, value) => {
        newSelect.attr(`data-${key}`, value);
      });

      search.replaceWith(newSelect);

      // Actualizar la referencia a `search` para apuntar al nuevo select
      search = newSelect;
      const object = {
        element: search,
        array: array,
        firstOption: placeHolder,
      };
      const elem = object.element;
      elem.empty(); // Vaciar el contenido del elemento
      object.array?.forEach((arrayElem, i) => {
        if (!arrayElem?.name) return; //No incluyo aquellos paises que no tienen code
        let option;
        if (i == 0) {
          option = $("<option>", {
            value: "",
            html: object.firstOption,
          });
          elem.append(option);
        }
        option = $("<option>", {
          value: arrayElem.id,
          html: arrayElem.name,
        });
        elem.append(option);
      });
      // Hacer algo si hay más de una opción
      elem.dropdown("set selected", values).dropdown({
        fullTextSearch: "exact",
        showOnFocus: false,
        clearable: true,
        forceSelection: false,
      });
    }
  });
}

export function activateCheckboxTogglers() {
  $(".ui.checkbox").checkbox();
}

// Se fija si esta en desktop
export function isInMobile() {
  return window.innerWidth < 768; // Mobile
}

//Arma los body data de las entidades
export function buildPhoneBodyData(form) {
  return {
    country_id: form.phone_country_id?.value,
    phone_number: form.phone_number?.value,
    id: userLogged ? undefined : generateRandomString(10),
    defaultPhone: form["phone_default"]?.checked,
  };
}

export function buildAddressBodyData(form) {
  return {
    label: form["address-label"]?.value,
    street: form["address-street"]?.value,
    detail: form["address-detail"]?.value,
    city: form["address-city"]?.value,
    province: form["address-province"]?.value,
    country_id: form["address-country-id"]?.value,
    zip_code: form["address-zip"]?.value,
    id: userLogged ? undefined : generateRandomString(10),
    defaultAddress: form["address-default"]?.checked,
  };
}

export function buildProductBodyData(form) {
  let bodyDataToReturn = {
    name: form["product_name"]?.value,
    price: form["product_price"]?.value,
    discount: form["product_discount"]?.value,
    description: form["product_description"]?.value,
    categories_id: form["product_categories_id"]?.value,
    active: form["product_active"]?.checked,
    brands_id: form["product_brands_id"]?.value,
    variations: [],
    images: [],
    filesFromArray: [],
    current_images: [],
  };
  const variationFields = document.querySelectorAll(".variation_field") || [];
  variationFields.forEach((field) => {
    const colorId = field.querySelector(
      'select[name="variation_colors_id"]'
    ).value;
    // Ahora agarro todas las cajitas de size & stock
    const sizeContainers =
      field.querySelectorAll(".variation_size_container") || [];
    sizeContainers.forEach((sizeField) => {
      const sizeId = sizeField.querySelector(
        'select[name="variation_sizes_id"]'
      ).value;
      const stock = sizeField.querySelector(
        'input[name="variation_stock"]'
      ).value;
      bodyDataToReturn.variations.push({
        colors_id: colorId,
        sizes_id: parseInt(sizeId),
        quantity: parseInt(stock),
      });
    });
  });
  const imagesInput = form["product_image"];
  //Aca cargo imagenes
  if (imagesInput && imagesInput.files?.length > 0) {
    bodyDataToReturn.images = Array.from(imagesInput.files); // Convertir FileList a Array
    // Crear un array con los nombres de los archivos
    bodyDataToReturn.filesFromArray = bodyDataToReturn.images.map((file) => {
      const relatedContainer = document.querySelector(
        `[data-filename="${file.name}"]`
      );
      const imagePositionSelect = relatedContainer.querySelector(
        'select[name="image_position"]'
      );
      const isMainImage = imagePositionSelect.value == 1;
      return {
        filename: file.name,
        main_file: isMainImage,
        position: imagePositionSelect.value,
      };
    });
  }
  //Ahora agrego los filenames que quedaron del producto de antes
  const productOldFiles = document.querySelectorAll(".image_box.old_file");
  productOldFiles?.forEach((prodFile) => {
    const positionSelect = prodFile.querySelector(
      'select[name="image_position"]'
    );
    const isMainFile = positionSelect.value == 1;
    bodyDataToReturn.current_images.push({
      id: prodFile.dataset.db_id,
      filename: prodFile.dataset.filename,
      main_file: isMainFile,
      position: positionSelect.value,
    });
  });
  // Convertir el objeto en FormData
  const formData = new FormData();

  // Agregar campos normales al FormData
  Object.keys(bodyDataToReturn).forEach((key) => {
    if (
      key === "variations" ||
      key === "filesFromArray" ||
      key == "current_images"
    ) {
      // Convertir las variaciones a JSON y agregar al FormData
      formData.append(key, JSON.stringify(bodyDataToReturn[key]));
    } else if (key === "images") {
      // Agregar archivos al FormData
      bodyDataToReturn.images.forEach((file) => {
        formData.append("images", file); // `images` debe coincidir con el nombre esperado en backend
      });
    } else if (bodyDataToReturn[key] !== undefined) {
      formData.append(key, bodyDataToReturn[key]);
    }
  });

  return formData;
}

export function buildUserSignUpBodyData(form) {
  return {
    first_name: form["user-first-name"]?.value,
    last_name: form["user-last-name"]?.value,
    email: form["user-email"]?.value,
    rePassword: form["user-re-password"]?.value,
    password: form["user-password"]?.value,
    payment_type_id: getLocalStorageItem("payment_type_id"),
  };
}
export function buildUserLoginBodyData(form) {
  return {
    email: form["user-email"]?.value,
    password: form["user-password"]?.value,
  };
}
export function buildBrandBodyData(form) {
  let bodyDataToReturn = {
    name: form["brand_name"]?.value,
  };

  const logoInput = form["brand_logo"];
  const isotypeInput = form["brand_isotype"];
  const logotypeInput = form["brand_logotype"];

  if (logoInput && logoInput.files?.length > 0)
    bodyDataToReturn.logo = Array.from(logoInput.files); // Convertir FileList a Array

  if (isotypeInput && isotypeInput.files?.length > 0)
    bodyDataToReturn.isotype = Array.from(isotypeInput.files); // Convertir FileList a Array

  if (logotypeInput && logotypeInput.files?.length > 0)
    bodyDataToReturn.logotype = Array.from(logotypeInput.files); // Convertir FileList a Array

  // Crear FormData
  const formData = new FormData();

  // Agregar campos normales al FormData
  Object.keys(bodyDataToReturn).forEach((key) => {
    if (["logo", "isotype", "logotype"].includes(key)) {
      // Agregar archivos al FormData si existen
      bodyDataToReturn[key].forEach((file) => {
        formData.append(key, file);
      });
    } else if (bodyDataToReturn[key] !== undefined) {
      formData.append(key, bodyDataToReturn[key]);
    }
  });

  return formData;
}
export function buildColorBodyData(form) {
  return {
    name: form["color_name"]?.value,
  };
}
export function buildDropBodyData(form) {
  let bodyDataToReturn = {
    name: form["drop_name"]?.value,
    launch_date: form["drop_launch_date"]?.value,
    active: form["drop_active"]?.checked,
    unique: form["drop_unique"]?.checked,
    productIDS: [],
    images: [],
    filesFromArray: [],
    current_images: [],
  };

  const bgInput = form["drop_bg_image"];
  const cardInput = form["drop_card_images"];

  // Agregar imágenes si existen
  if (bgInput?.files?.length > 0) {
    bodyDataToReturn.images = bodyDataToReturn.images.concat(
      Array.from(bgInput.files)
    );
  }

  if (cardInput?.files?.length > 0) {
    bodyDataToReturn.images = bodyDataToReturn.images.concat(
      Array.from(cardInput.files)
    );
  }
  bodyDataToReturn.filesFromArray = bodyDataToReturn.images.map((file) => {
    const relatedContainer = document.querySelector(
      `[data-filename="${file.name}"]`
    );
    const imagePositionSelect = relatedContainer.querySelector(
      'select[name="image_position"]'
    );
    const isMainImage = imagePositionSelect
      ? imagePositionSelect?.value == 1
      : null;
    return {
      filename: file.name,
      main_file: isMainImage,
      position: imagePositionSelect ? imagePositionSelect.value : null,
      file_roles_id: imagePositionSelect ? 1 : 2, //Si tiene select es porque es card, sino es background
    };
  });

  //Ahora agrego los filenames que quedaron del producto de antes
  const productOldFiles = document.querySelectorAll(
    ".image_box.old_file,.old_image_container"
  );
  productOldFiles?.forEach((prodFile) => {
    const positionSelect = prodFile.querySelector(
      'select[name="image_position"]'
    );
    const isMainFile = positionSelect ? positionSelect.value == 1 : null;
    bodyDataToReturn.current_images.push({
      id: prodFile.dataset.db_id,
      filename: prodFile.dataset.filename,
      main_file: isMainFile,
      position: positionSelect ? positionSelect.value : null,
      file_roles_id: positionSelect ? 1 : 2,
    });
  });

  // PAra los ids de productos
  const productsIDS = form?.querySelectorAll(".product_search_input a.label");
  productsIDS?.forEach((prod) => {
    const prodID = prod.dataset.value;
    bodyDataToReturn.productIDS.push(prodID);
  });
  // Crear FormData
  const formData = new FormData();

  // Agregar campos normales al FormData
  Object.entries(bodyDataToReturn).forEach(([key, value]) => {
    if (
      key === "variations" ||
      key === "filesFromArray" ||
      key == "current_images" ||
      key == "productIDS"
    ) {
      // Convertir las variaciones a JSON y agregar al FormData
      formData.append(key, JSON.stringify(bodyDataToReturn[key]));
    } else if (key === "images" && value.length > 0) {
      value.forEach((file) => {
        formData.append("images", file);
      });
    } else if (value !== undefined) {
      formData.append(key, value);
    }
  });

  return formData;
}

export function getDateString(date, withTime = false) {
  const orderDate = new Date(date);
  const locale = "es-ES"; // Idioma español

  // Opciones de formato de fecha
  let options = { day: "numeric", month: "long", year: "numeric" };

  // Si withTime es true, agregamos horas y minutos
  if (withTime) {
    options = { ...options, hour: "2-digit", minute: "2-digit" };
  }

  return orderDate.toLocaleDateString(locale, options);
}

//Una vez que se crea la entidad, ahi dependiendo si es en carro o profile tengo que hacer algo
export async function updateAddressElements() {
  try {
    // Obtener el path de la URL actual
    const path = window.location.pathname;
    //Me fijo url y en base a eso veo si estoy en cart o en el perfil del usuario
    // Verificar el final de la URL
    if (path.endsWith("/carro")) {
      // Lógica específica para la página del carrito
      await cartExportObj.paintCheckoutAddressesSelect();
    } else if (path.includes("/perfil")) {
      // Lógica específica para la página del perfil
      await userProfileExportObj.pageConstructor();
    }
  } catch (error) {
    return console.log(error);
  }
}
export async function updatePhoneElements() {
  try {
    // Obtener el path de la URL actual
    const path = window.location.pathname;
    //Me fijo url y en base a eso veo si estoy en cart o en el perfil del usuario
    // Verificar el final de la URL
    if (path.endsWith("/carro")) {
      // Lógica específica para la página del carrito
      await cartExportObj.paintCheckoutPhoneSelect();
    } else if (path.endsWith("/perfil")) {
      // Lógica específica para la página del perfil
      // Lógica específica para la página del perfil
      await userProfileExportObj.pageConstructor();
    }
  } catch (error) {
    return console.log(error);
  }
}
export async function updateProductTable() {
  try {
    userProfileExportObj.pageConstructor();
  } catch (error) {
    return console.log(error);
  }
}
export async function updateBrandTable() {
  try {
    userProfileExportObj.pageConstructor();
  } catch (error) {
    return console.log(error);
  }
}
export async function updateColorTable() {
  try {
    await userProfileExportObj.pageConstructor();
    $(".ui.dropdown.entity_picker_select").dropdown("set selected", 2);
  } catch (error) {
    return console.log(error);
  }
}
export async function updateDropTable() {
  try {
    await userProfileExportObj.pageConstructor();
    $(".ui.dropdown.entity_picker_select").dropdown("set selected", 1);
  } catch (error) {
    return console.log(error);
  }
}

//Crea y actualiza los valores de phone & address del usuario loggeado (se supone que solo creamos phone & address de los usuarios)
export async function handlePhoneFetch(bodyData, method) {
  let response = await fetch("/api/phone", {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData),
  });

  if (response.ok) {
    response = response.ok && (await response.json());
    //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
    if (method == "POST") {
      //Aca agrego
      userLogged.phones?.push(response.phone);
    } else if (method == "PUT") {
      //Aca modifico, tengo que modificar en el array de userlogged
      let phoneToChangeIndex = userLogged.phones?.findIndex(
        (phoneFromDB) => phoneFromDB.id == bodyData.id
      );
      if (phoneToChangeIndex < 0) return;
      bodyData.country = countriesFromDB.find(
        (counFromDB) => counFromDB.id == bodyData.country_id
      ); // Esto es para que me lleve la entidad y poder pintar el nombre del pais
      userLogged.phones[phoneToChangeIndex] = bodyData;
    }
    let responseMsg = response.msg;
    showCardMessage(true, responseMsg);
    return true;
  }
  return false;
}
export async function handleAddressFetch(bodyData, method) {
  let response = await fetch("/api/address", {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData),
  });

  if (response.ok) {
    response = response.ok && (await response.json());
    //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
    if (method == "POST") {
      //Aca agrego
      userLogged.addresses?.push(response.address);
    } else if (method == "PUT") {
      //Aca modifico, tengo que modificar en el array de userlogged
      let addressToChangeIndex = userLogged.addresses?.findIndex(
        (addressFromDB) => addressFromDB.id == bodyData.id
      );
      if (addressToChangeIndex < 0) return;
      userLogged.addresses[addressToChangeIndex] = bodyData;
    }
    let responseMsg = response.msg;
    showCardMessage(true, responseMsg);
    return true;
  }
  let msg = "Ha ocurrido un error, intente nuevamente";
  showCardMessage(false, msg);
  return false;
}

export async function handleProductFetch(bodyData, method) {
  try {
    let fetchURL =
      method == "POST" ? `/api/product` : `/api/product/${bodyData.get("id")}`;
    let response = await fetch(fetchURL, {
      method: method,
      body: bodyData,
    });
    response = await response.json();
    if (response.ok) {
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      if (method == "POST") {
        //Aca agrego
        productsFromDB?.push(response.product);
      } else if (method == "PUT") {
        //Aca modifico, tengo que modificar en el array de userlogged
        let productToChangeIndex = productsFromDB?.findIndex(
          (prodFromDB) => prodFromDB.id == response?.product?.id
        );
        if (productToChangeIndex < 0) return;
        productsFromDB[productToChangeIndex] = response.product;
      }
      let responseMsg = response.msg;
      showCardMessage(true, responseMsg);
      return true;
    }
    showCardMessage(false, response.msg);
    return false;
  } catch (error) {
    return console.log(error);
  }
}

export async function handleUserLoginFetch(bodyData) {
  let response = await fetch("/api/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData),
  });
  if (response.ok) {
    response = response.ok ? await response.json() : null;
    if (response.ok) {
      //Esta es la respuesta de las credenciales
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      showCardMessage(true, response.msg);
      await checkForUserLogged();
      const bodyName = document.querySelector("body").dataset?.page_name;
      // Esto es porque si pasa de no estar logeado a estarlo, pinto los productos del carro
      if (bodyName == "cart") await cartExportObj.pageConstructor();
      checkCartItemsToPaintQuantity();
      return true;
    }

    showCardMessage(false, response.msg);
    return false;
  }
  let msg = "Credenciales Incorrectas";
  showCardMessage(false, msg);
  return false;
}
export async function handleUserSignUpFetch(bodyData) {
  let response = await fetch("/api/user/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData),
  });
  if (response.ok) {
    response = response.ok ? await response.json() : null;
    //Esta es la respuesta de las credenciales
    //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
    showCardMessage(true, response.msg);
    await checkForUserLogged();
    return (window.location.href = "/");
  }
  let msg = "Ha ocurrido un error inesperado, intente nuevamente";
  showCardMessage(false, msg);
  return false;
}

export async function handleBrandFetch(bodyData, method) {
  try {
    let fetchURL =
      method == "POST" ? `/api/brand` : `/api/brand/${bodyData.get("id")}`;
    let response = await fetch(fetchURL, {
      method: method,
      body: bodyData,
    });
    response = await response.json();

    if (response.ok) {
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      if (method == "POST") {
        //Aca agrego
        brandsFromDB?.push(response.brand);
      } else if (method == "PUT") {
        //Aca modifico, tengo que modificar en el array de userlogged
        let brandToChangeIndex = brandsFromDB?.findIndex(
          (brandFromDB) => brandFromDB.id == response?.brand?.id
        );
        if (brandToChangeIndex < 0) return;
        brandsFromDB[brandToChangeIndex] = response.brand;
      }
      let responseMsg = response.msg;
      showCardMessage(true, responseMsg);
      return true;
    }
    showCardMessage(false, response.msg);
    return false;
  } catch (error) {
    return console.log(error);
  }
}
export async function handleDropFetch(bodyData, method) {
  try {
    let fetchURL =
      method == "POST" ? `/api/drop` : `/api/drop/${bodyData.get("id")}`;
    let response = await fetch(fetchURL, {
      method: method,
      body: bodyData,
    });
    response = await response.json();

    if (response.ok) {
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      if (method == "POST") {
        //Aca agrego
        dropsFromDB?.push(response.drop);
      } else if (method == "PUT") {
        //Aca modifico, tengo que modificar en el array de userlogged
        let dropToChangeIndex = dropsFromDB?.findIndex(
          (dropFromDB) => dropFromDB.id == response?.drop?.id
        );
        if (dropToChangeIndex < 0) return;
        dropsFromDB[dropToChangeIndex] = response.drop;
      }
      let responseMsg = response.msg;
      showCardMessage(true, responseMsg);
      return true;
    }
    showCardMessage(false, response.msg);
    return false;
  } catch (error) {
    return console.log(error);
  }
}
export async function handleColorFetch(bodyData, method) {
  try {
    let fetchURL =
      method == "POST" ? `/api/color` : `/api/color/${bodyData.id}`;
    let response = await fetch(fetchURL, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    response = await response.json();

    if (response.ok) {
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      if (method == "POST") {
        //Aca agrego
        colorsFromDB?.push(response.color);
      } else if (method == "PUT") {
        //Aca modifico, tengo que modificar en el array de userlogged
        let colorToChangeIndex = colorsFromDB?.findIndex(
          (colorFromDB) => colorFromDB.id == response?.color?.id
        );
        if (colorToChangeIndex < 0) return;
        colorsFromDB[colorToChangeIndex] = response.color;
      }
      let responseMsg = response.msg;
      showCardMessage(true, responseMsg);
      return true;
    }
    showCardMessage(false, response.msg);
    return false;
  } catch (error) {
    return console.log(error);
  }
}

//Deshabilita un boton por x cantidad de tiempo
export function disableBtn(btn, time) {
  btn.classList.add("disabled");
  setTimeout(() => {
    btn.classList.remove("disabled");
  }, time);
}
export function getProductMainImage(prod) {
  let mainFile;
  const { files } = prod;
  if (files.length > 0) {
    files.forEach((file) => {
      if (file.main_file === 1) {
        mainFile = file;
        return;
      }
    });
  } else {
    mainFile = null;
  }
  return mainFile;
}

export function getProductImageSizeUrl(file, screenWidth) {
  const sizeToFind = screenWidth <= 720 ? "1x" : "2x";
  const url = file.file_urls.find((fileUrl) => fileUrl.size === sizeToFind).url;
  return url;
}

export function scrollToTop() {
  return window.scrollTo(0, 0);
}

//Estas funciones pintan y activan el modal de telefonos/direcciones
export const handleNewPhoneButtonClick = async (phone = undefined) => {
  await createPhoneModal(phone);
  // Abro el modal
  handlePageModal(true);
  // await listenToPhoneCreateBtn()//hago el fetch para crear ese telefono
};
export const handleNewAddressButtonClick = async (address = undefined) => {
  await createAddressModal(address);
  // Abro el modal
  handlePageModal(true);
};

export const handleRemoveAddressButtonClick = async (address) => {
  disableAddressModal(address);
  // Abro el modal
  handlePageModal(true);
  // Agrego la escucha para borrar
  const form = document.querySelector(".ui.modal form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Hago el fetch para borrar
    let response = await fetch(`/api/address/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address_id: address.id }),
    });
    if (response.ok) {
      response = await response.json();
      const addressIndexFromList = userLogged.addresses?.findIndex(
        (add) => add.id == address.id
      );
      if (addressIndexFromList !== -1) {
        userLogged.addresses.splice(addressIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updateAddressElements();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
  });
};
export const handleRemovePhoneButtonClick = async (phone) => {
  disablePhoneModal(phone);
  // Abro el modal
  handlePageModal(true);
  // Agrego la escucha para borrar
  const form = document.querySelector(".ui.modal form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Hago el fetch para borrar
    let response = await fetch(`/api/phone/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_id: phone.id }),
    });
    if (response.ok) {
      response = await response.json();
      const phoneIndexFromList = userLogged.phones?.findIndex(
        (dbPhone) => dbPhone.id == phone.id
      );
      if (phoneIndexFromList !== -1) {
        userLogged.phones.splice(phoneIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updatePhoneElements();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
  });
};
// recibe fecha en 2025-01-29T18:33:30.000Z y la pasa a dia, mes y año
export const sanitizeDate = (date) => {
  const fecha = new Date(date);
  const dia = fecha.getUTCDate().toString().padStart(2, "0");
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, "0"); // Sumar 1 porque los meses van de 0 a 11
  const año = fecha.getUTCFullYear();
  return `${dia}-${mes}-${año}`;
};

export const handleUpdateZonePrices = async (pricesObject, zoneId) => {
  const { usdPriceInputValue, arsPriceInputValue } = pricesObject;
  const updateResponse = await fetch(`/api/shipping/zones/${zoneId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      usd_price: usdPriceInputValue,
      ars_price: arsPriceInputValue,
    }),
  });
  return updateResponse.ok;
};

//Retorna la menor cantidad de decimales
export function minDecimalPlaces(number) {
  // Convert the number to a string
  const numberString = number.toString();

  // Check if the number has decimals
  if (numberString.includes(".")) {
    // Remove unnecessary zeros at the end of the decimal part
    const decimalsWithoutZeros = numberString.replace(/\.?0+$/, "");
    // If there are no decimals left, remove the decimal point
    return decimalsWithoutZeros.replace(/\.$/, "");
  } else {
    // If the number has no decimals, simply return the number as it is
    return numberString;
  }
}

export function displayBigNumbers(nmbr) {
  return parseFloat(nmbr)
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getLastParamFromURL() {
  const url = new URL(window.location.href);
  const pathSegments = url.pathname.split("/");
  return pathSegments[pathSegments.length - 1];
}

export function handleInputFileFromModal({ show }) {
  const containerToShow = document.querySelector(
    ".ui.modal .input_file_container"
  );
  if (show) return containerToShow.classList.remove("hidden");
  return containerToShow.classList.add("hidden");
}

export function getDeepCopy(arg) {
  return JSON.parse(JSON.stringify(arg));
}

export function removeIndexesFromArray(arr, indexesToRemove) {
  return arr.filter((_, index) => !indexesToRemove.includes(index));
}

export function copyToClipboard(container) {
  container.select();
  document.execCommand("copy");
  container.blur();
}

export function copyElementValue(value) {
  const textareaToCopyMails = document.createElement("textarea");
  textareaToCopyMails.innerHTML = value;
  document.body.appendChild(textareaToCopyMails);
  copyToClipboard(textareaToCopyMails);
  textareaToCopyMails.remove();
}
export function activateCopyMsg() {
  const copyPDiv = document.querySelector(".copy_p_msg.ui.message");
  copyPDiv.innerHTML = "¡Copiado!";
  copyPDiv?.classList.add("copy_p_msg_active");
  setTimeout(() => {
    copyPDiv?.classList.remove("copy_p_msg_active");
  }, 1000);
}

export function isOnPage(path) {
  const currentPath = window.location.pathname.replace(/\/$/, ""); // Elimina la barra final
  // Si path es vacío o "index", considerar como "/"
  if (path === "") {
    return currentPath === "" || currentPath === "/";
  }

  return currentPath.endsWith(path);
}

export async function scriptInitiator() {
  try {
    await checkForUserLogged();
    headerExportObject.headerScriptInitiator();
    let payingOrder = handleOrderInLocalStorage({ type: 2 });
    if (payingOrder && !isOnPage("post-compra")) {
      //Aca tengo que dar de baja la orden
      let response = await fetch(`/api/order/paymentFailed/${payingOrder}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        response = await response.json();
        //Ahora si se cancelo o se autoaprobo de db entonces lo elimino de localStorage
        if (response.orderWasCanceled || response.orderWasFulfilled) {
          handleOrderInLocalStorage({ type: 3 });
          if (response.orderWasFulfilled)
            return (window.location.href = `/post-compra?orderId=${response.tra_id}`);
        }
      }
    }
  } catch (error) {
    return console.log(error);
  }
}

export function handleOrderInLocalStorage({ type, orderID = undefined }) {
  //Types: 1: setear con orderID || 2: Chequear || 3: Borrar
  //Entra al localstorage isPaying y se fija si hay.
  type = parseInt(type);
  let returnVar = true;
  // Si llega a haber, entonces damos de baja la orden
  switch (type) {
    case 1:
      setLocalStorageItem("payingOrderID", orderID);
      break;

    case 2:
      returnVar = getLocalStorageItem("payingOrderID");
      break;

    case 3:
      deleteLocalStorageItem("payingOrderID");
      break;

    default:
      break;
  }
  return returnVar;
}

// Va por todos los select dropdowns del html y si no tiene opciones los activa
export function checkForSelectFinders(param) {
  try {
    const brandSearchClass = ".ui.dropdown.brand_search_input.search";
    const colorSearchClass = ".ui.dropdown.color_search_input.search";
    const productSearchClass = ".ui.dropdown.product_search_input.search";

    const searchs = $(
      `${brandSearchClass},${colorSearchClass},${productSearchClass}`
    );
    let object;
    // Voy por los distintos search
    searchs?.each(function () {
      let search = $(this);
      // Guardar las clases del elemento actual
      const arrayName = search.data("array_name");
      const entityName = search.data("entity_name");
      const isPhoneCodeSearch = search.hasClass("phone_code_search_input");
      // Basicamente lo inicio siempre que venga el array
      if (param[arrayName]?.length) {
        let arrayToUse = param[arrayName];
        if (isPhoneCodeSearch) {
          arrayToUse = sortArrayByPhoneCode(arrayToUse);
        }
        // Reemplazar el select por uno nuevo vacío
        // Crear un nuevo elemento <select>
        const newSelect = $("<select>");

        // Copiar las clases
        newSelect.attr("class", search.attr("class"));

        // Copiar el nombre
        newSelect.attr("name", search.attr("name"));

        // Copiar otros atributos estándar
        if (search.attr("multiple") !== undefined) {
          newSelect.attr("multiple", "");
        }
        if (search.attr("required") !== undefined) {
          newSelect.attr("required", "");
        }

        // Copiar todos los data-* attributes
        $.each(search.data(), (key, value) => {
          newSelect.attr(`data-${key}`, value);
        });

        search.replaceWith(newSelect);

        // Actualizar la referencia a `search` para apuntar al nuevo select
        search = newSelect;
        object = {
          element: search,
          array: arrayToUse,
          firstOption: `Select ${entityName}`,
        };
        paintSearchDropdown(object, isPhoneCodeSearch);
      }
    });
    return;
  } catch (error) {
    console.log("Falle en checkForSelectFinders");
    return console.log(error);
  }
}
//Pinta los selects finders
export function paintSearchDropdown(object, isCountryCode) {
  const elem = object.element;
  elem.empty(); // Vaciar el contenido del elemento
  object.array?.forEach((arrayElem, i) => {
    if (isCountryCode && !arrayElem.phone_code) return; //No incluyo aquellos paises que no tienen code
    let option;
    if (i == 0) {
      option = $("<option>", {
        value: "",
        html: object.firstOption,
      });
      elem.append(option);
    }
    option = $("<option>", {
      value: arrayElem.id,
      html: isCountryCode
        ? `+${arrayElem.phone_code} (${arrayElem.name})`
        : arrayElem.name,
    });
    elem.append(option);
  });
  // Hacer algo si hay más de una opción
  elem.dropdown({
    fullTextSearch: "exact",
    clearable: true,
    forceSelection: false,
  });
}

//Esta funcion es para hacer el init del dropdown de color
export function initiateColorDropdown(container, colorID = null) {
  // Inicio el select con ese color
  const object = {
    colorsFromDB,
  };
  checkForSelectFinders(object);
  if (!colorID) return;
  const colorDropdown = $(container).find(
    ".ui.dropdown.color_search_input.search"
  );
  colorDropdown.dropdown("set selected", [colorID]).dropdown({
    fullTextSearch: "exact",
    showOnFocus: false,
    clearable: true,
  });
  return;
}

// Función para manejar cambios en input file y obtener src de imágenes en base64
export function handleFileInputChange(event, callback) {
  const input = event.target;
  const files = Array.from(input.files);

  if (!files.length) return; // No hacer nada si no se seleccionó archivo

  const filePromises = files.map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({ file, src: reader.result, filename: file.name }); // Retorna archivo y su src
    });
  });

  // Cuando todas las imágenes se hayan convertido, ejecuta el callback
  Promise.all(filePromises).then((fileData) => {
    callback(fileData, input);
  });
}

export async function saveSetting(id, container) {  
  const button = container.querySelector('.ui.button');
  const input = container.querySelector('input');
  const value = input.value;
  if(!id) return
  console.log(`Guardando ajuste ${id}: ${value}`);
  button.classList.add('loading')
  let response = await fetch(`/api/setting/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
  })
  response = await response.json();
  button.classList.remove('loading');
  showCardMessage(response.ok, response.msg);
  if(response.ok){
    const settingIndexToChange = settingsFromDB.findIndex(dbIndex=>dbIndex.id == id);
    settingsFromDB[settingIndexToChange].value = value;
  }
  return;
}
