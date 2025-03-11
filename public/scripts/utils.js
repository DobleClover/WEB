import { createUserSignUpModal } from "./componentRenderer";

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


export function handleUserSignUpClick() {
  createUserSignUpModal();
  handlePageModal(true);
  const passwordRequirements = []
  if (isInSpanish){
    passwordRequirements.push('Longitud Minima: 8 Caracteres');
    passwordRequirements.push('Al menos 1 mayuscula');
  }else{
    passwordRequirements.push('Minimum Length: 8 Characters');
    passwordRequirements.push('At least 1 uppercase');
  }
  const passwordTooltip = generateTooltip(passwordRequirements);
  const passwordField = document.querySelector('.ui.modal .password-field label');
  passwordField.appendChild(passwordTooltip);
  // Inicializar el popup de Semantic UI con soporte para HTML
  $('.tooltip-icon').popup({
    popup: $('.tooltip-content'),
    on: 'hover',
    hoverable: true,
    position: 'left center' // Mueve el tooltip a la izquierda
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
      bodyData.user_id = userLogged.id;
      if (postToDatabase) {
        try {
          fetchResponse = await postToDatabase(bodyData, method);
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
    submitButton.classList.remove("loading");
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
  submitButton.classList.add("basic"); //Lo dejo basic antes
  let formIsComplete = checkForAllModalRequiredFields();
  if (!formIsComplete) {
    submitButton.classList.remove("basic"); //Lo dejo full rojo
    modalForm.classList.add("error"); //Le agrego el rojo
    errorsContainer.innerHTML = `<p>${
      isInSpanish
        ? "Debes completar todos los campos requeridos"
        : "You have to complete all required fields"
    }</p>`;
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

export function buildUserLoginBodyData(form) {
  return {
    email: form["user-email"]?.value,
    password: form["user-password"]?.value,
  };
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
      showCardMessage(true, isInSpanish ? response.msg.es : response.msg.en);
      await checkForUserLogged();
      const bodyName = document.querySelector("body").dataset.page_name;
      // Esto es porque si pasa de no estar logeado a estarlo, pinto los productos del carro
      if (bodyName == "cart") await cartExportObj.pageConstructor();
      checkCartItemsToPaintQuantity()
      return true;
    }
    showCardMessage(false, isInSpanish ? response.msg.es : response.msg.en);
    return false;
  }
  let msg = isInSpanish
    ? "Ha ocurrido un error inesperado, intente nuevamente"
    : "There was an unexpected error, please try again";
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
    showCardMessage(true, isInSpanish ? response.msg.es : response.msg);
    await checkForUserLogged();
    return (window.location.href = "/");
    return;
  }
  let msg = isInSpanish
    ? "Ha ocurrido un error inesperado, intente nuevamente"
    : "There was an unexpected error, please try again";
  showCardMessage(false, msg);
  return false;
}

//Pinta la tarjeta de succes/error
export function showCardMessage(isPositive, messageText) {
  // Seleccionar el contenedor padre
  const messageContainer = document.querySelector(".view-message-container");

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
