import { handleUserLoginModal, handleUserSignUpModal } from "./modalHandlers.js";
import { handleUserSignUpClick, toggleInputPasswordType } from "./utils.js";

export function createProductCard(props) {
  const { id, name, category, price, files, discount } = props;

  // Crear elementos
  const card = document.createElement("a");
  card.className = `card product_card ${discount ? "discount_card" : ""}`;
  card.href = `/product/${id}`;

  const imagesWrapper = document.createElement("div");
  imagesWrapper.className = "card_images_wrapper";

  const cardImage = document.createElement("div");
  cardImage.className = "card_image";

  const mainImageObj = files.find((file) => file.mainImage) || files[0];
  const mainImage = document.createElement("img");
  mainImage.className = "card_main_image card_main_image_active";
  mainImage.src = mainImageObj ? `/img/product/${mainImageObj.filename}` : "";
  mainImage.alt = `Main image for ${name}`;

  const hoveredImage = document.createElement("img");
  hoveredImage.className = "card_alternative_image";
  hoveredImage.alt = "Alt Image";

  cardImage.appendChild(mainImage);
  cardImage.appendChild(hoveredImage);
  if (discount) {
    const saleTag = document.createElement("div");
    saleTag.className = "sale_tag";
    saleTag.textContent = "SALE";
    cardImage.appendChild(saleTag);
  }
  const otherImagesContainer = document.createElement("div");
  otherImagesContainer.className = "card_other_image";

  files.forEach((file) => {
    if (file.mainImage) return;
    const otherImage = document.createElement("img");
    otherImage.src = `/img/product/${file.filename}`;
    otherImage.alt = `Image for ${name}`;
    otherImagesContainer.appendChild(otherImage);
  });

  imagesWrapper.appendChild(cardImage);
  imagesWrapper.appendChild(otherImagesContainer);

  const cardInfo = document.createElement("div");
  cardInfo.className = "card_information";

  const cardHeader = document.createElement("div");
  cardHeader.className = "card_header product_card_name";
  cardHeader.textContent = name;

  const cardCategory = document.createElement("div");
  cardCategory.className = "card_desc product_card_category";
  cardCategory.textContent = category;

  const cardPrice = document.createElement("div");
  cardPrice.className = `card_price product_card_price`;
  cardPrice.textContent = `$${price.toLocaleString()}`;
  let discountedPrice;
  if (discount) {
    discountedPrice = document.createElement("div");
    discountedPrice.className = `card_price product_card_price discount_price`;
    discountedPrice.textContent = `$${(
      (discount + 1) *
      price
    ).toLocaleString()}`;
    cardPrice.textContent = "";
    const originalPrice = document.createElement("span");
    originalPrice.className = "original_price";
    originalPrice.textContent = `$${price.toLocaleString()}`;
    cardPrice.appendChild(originalPrice); // Agregarlo junto al precio original
    // Crear el elemento para mostrar el porcentaje de descuento
    const discountInfo = document.createElement("span");
    discountInfo.className = "discount_info";
    discountInfo.textContent = ` ${discount * 100}% OFF`;
    cardPrice.appendChild(discountInfo); // Agregarlo junto al precio original
  }
  cardInfo.appendChild(cardHeader);
  cardInfo.appendChild(cardCategory);
  cardInfo.appendChild(cardPrice);
  discount ? cardInfo.appendChild(discountedPrice) : null;

  card.appendChild(imagesWrapper);
  card.appendChild(cardInfo);

  return card;
}

export async function createUserLoginModal() {
  try {
    createModal({
      headerTitle: "Iniciar Sesion ",
      formFields: [
        {
          label: "Email",
          type: "text",
          name: "user-email",
          required: true,
          placeHolder: "Email",
        },
        {
          label: "Contraseña",
          type: "password",
          name: "user-password",
          required: true,
          placeHolder: "Contraseña",
          icon: "eye link", // Icono de ojo
          iconCallback: toggleInputPasswordType,
        },
      ],
      buttons: [
        {
          text: "Iniciar Sesión",
          type: "button",
          className: "ui button submit green send-modal-form-btn",
          onClick: async () => await handleUserLoginModal(),
        },
        {
          text: "Registrarse",
          className:
            "ui button right floated basic green submit sign-up-btn",
          onClick: async () => handleUserSignUpClick(),
        },
      ],
    });
    // Armo el event listener
    document
      .querySelector(".ui.modal")
      .addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
          await handleUserLoginModal();
        }
      });
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}

export async function createUserSignUpModal() {
  try {
    createModal({
      headerTitle: "Registrarse",
      formFields: [
        {
          type: "two-fields",
          fields: [
            {
              label: "Nombre",
              type: "text",
              name: "user-first-name",
              className: "",
              required: true,
            },
            {
              label: "Apellido",
              type: "text",
              className: "",
              name: "user-last-name",
              required: true,
            },
          ],
        },
        {
          label: "Email",
          type: "text",
          name: "user-email",
          required: true,
          placeHolder: "Email",
        },
        {
          label: "Contraseña",
          type: "password",
          name: "user-password",
          required: true,
          placeHolder: "Contraseña",
          icon: "eye link", // Icono de ojo
          containerClassName: "password-field",
          iconCallback: toggleInputPasswordType,
        },
        {
          label: "Confirmar contraseña",
          type: "password",
          name: "user-re-password",
          required: true,
          placeHolder: "Contraseña",
          icon: "eye link", // Icono de ojo
          iconCallback: toggleInputPasswordType,
        },
      ],
      buttons: [
        {
          text: "Registrarse" ,
          className: "ui button submit green send-modal-form-btn",
          onClick: async () => await handleUserSignUpModal(),
        },
      ],
    });
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}

export function createModal({
  headerTitle,
  formClassName = "",
  formFields,
  buttons,
  id,
}) {
  destroyExistingModal();
  const modal = document.createElement("div");
  modal.className = "ui small modal";
  if (id) modal.dataset.db_id = id;

  // Crear el header
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `${headerTitle} <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  // Crear el contenido principal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = `ui form ${formClassName}`;

  // Crear los campos del formulario
  formFields.forEach((field) => {
    if (field.type === "header") {
      // Crear un header <h4>
      const headerElement = document.createElement("h4");
      headerElement.className = "ui dividing header";
      headerElement.textContent = field.label || "";
      form.appendChild(headerElement);
    } else if (field.type.endsWith("-fields")) {
      const fieldContainer = document.createElement("div");

      // Reemplazar "-" con un espacio para generar la clase correcta
      fieldContainer.className = field.type.replace("-", " ");

      field.fields.forEach((subField) => {
        const subFieldContainer = createField(subField);
        fieldContainer.appendChild(subFieldContainer);
      });

      form.appendChild(fieldContainer);
    } else if (field.type === "inline-fields") {
      const inlineContainer = document.createElement("div");
      inlineContainer.className = "inline fields";

      field.fields.forEach((subField) => {
        const subFieldContainer = createField(subField);
        inlineContainer.appendChild(subFieldContainer);
      });

      const fieldWrapper = document.createElement("div");
      fieldWrapper.className = "field";
      fieldWrapper.appendChild(inlineContainer);
      form.appendChild(fieldWrapper);
    } else {
      const fieldContainer = createField(field);
      form.appendChild(fieldContainer);
    }
  });

  // Crear el contenedor de botones
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "field margin-field";

  buttons.forEach((button) => {
    const btn = document.createElement("button");
    btn.type = button.type || "button";
    btn.className = button.className || "ui button";
    btn.textContent = button.text || "Button";
    btn.dataset.method = button.method;
    if (button.onClick) {
      btn.addEventListener("click", button.onClick);
    }

    buttonContainer.appendChild(btn);
  });

  form.appendChild(buttonContainer);

  // Agregar mensaje de error
  const errorMessage = document.createElement("div");
  errorMessage.className = "ui error message";
  form.appendChild(errorMessage);

  content.appendChild(form);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Evento para cerrar el modal
  modal
    .querySelector(".close-modal-btn")
    ?.addEventListener("click", () => closeModal());

  return modal;
}

function createField(field) {
  // Crear el contenedor del campo
  const fieldContainer = document.createElement("div");
  fieldContainer.className = `field ${field.containerClassName || ""}`; // Usar containerClassName

  // Agregar etiqueta si está presente
  if (field.label) {
    const label = document.createElement("label");
    label.textContent = field.label;
    fieldContainer.appendChild(label);
  }

  // Manejo de nestedFields (para soportar estructuras complejas)
  if (field.nestedFields) {
    field.nestedFields.forEach((nestedField) => {
      const nestedElement = createField(nestedField);
      fieldContainer.appendChild(nestedElement);
    });
  }

  // Manejo de togglers
  if (field.type === "toggle") {
    const toggleWrapper = document.createElement("div");
    toggleWrapper.className = "ui toggle checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = field.name;
    input.className = field.className || "hidden";
    input.checked = field.checked;

    const label = document.createElement("label");
    label.textContent = field.labelForToggle || "";

    toggleWrapper.appendChild(input);
    toggleWrapper.appendChild(label);
    fieldContainer.appendChild(toggleWrapper);
  }

  // Manejo de tipo date
  if (field.type === "date") {
    const input = document.createElement("input");
    input.type = "date";
    input.name = field.name;
    input.className = field.className || "";
    input.required = field.required || false;

    if (field.value) {
      input.value = field.value;
    }

    fieldContainer.appendChild(input);
  }

  // Manejo de select
  else if (field.type === "select") {
    const select = document.createElement("select");
    select.name = field.name;
    select.className = field.className || "ui dropdown";
    select.required = field.required || false;

    if (field.dataAttributes) {
      Object.entries(field.dataAttributes).forEach(([key, value]) => {
        select.dataset[key] = value;
      });
    }

    if (field.multiple) select.setAttribute("multiple", "");

    if (!field.options?.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Loading...";
      select.appendChild(opt);
    }

    (field.options || []).forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      if (field.value && field.value === option.value) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    fieldContainer.appendChild(select);
  }

  // Manejo de radio-group
  else if (field.type === "radio-group") {
    const radioGroup = document.createElement("div");
    radioGroup.className = "inline fields";

    (field.options || []).forEach((option, index) => {
      const radioField = document.createElement("div");
      radioField.className = "field";

      const radioDiv = document.createElement("div");
      radioDiv.className = "ui radio checkbox";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = field.name;
      input.value = option.value;
      input.checked = option.checked || index === 0;
      input.required = field.required || false;

      const label = document.createElement("label");
      label.textContent = option.label;

      radioDiv.appendChild(input);
      radioDiv.appendChild(label);
      radioField.appendChild(radioDiv);
      radioGroup.appendChild(radioField);
    });

    fieldContainer.appendChild(radioGroup);
  }

  // Manejo de textarea
  else if (field.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.name = field.name;
    textarea.placeholder = field.placeholder || "";
    textarea.className = field.className || "";
    textarea.required = field.required || false;

    if (field.value) {
      textarea.value = field.value;
    }

    fieldContainer.appendChild(textarea);
  } else if (field.icon) {
    const iconInputContainer = document.createElement("div");
    iconInputContainer.className = "ui icon input";

    const input = document.createElement("input");
    input.type = field.type || "text";
    input.name = field.name || "";
    input.placeholder = field.placeHolder || "";
    input.required = field.required || false;
    input.className = field.className || "";

    const icon = document.createElement("i");
    icon.className = `${field.icon} icon`;

    if (field.iconCallback && typeof field.iconCallback === "function") {
      icon.addEventListener("click", (event) =>
        field.iconCallback(event, input)
      );
    }

    iconInputContainer.appendChild(input);
    iconInputContainer.appendChild(icon);
    fieldContainer.appendChild(iconInputContainer);
  } else if (["text", "number", "email", "password"].includes(field.type)) {
    // Manejo de input estándar (text, number, email, password)
    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.name;
    input.placeholder = field.placeholder || "";
    input.className = field.className || "";
    input.required = field.required || false;

    if (field.value) {
      input.value = field.value;
    }

    // Opcionalmente, puedes agregar atributos específicos para inputs de contraseña
    if (field.type === "password") {
      input.autocomplete = field.autocomplete || "off";
    }

    fieldContainer.appendChild(input);
  }

  // Manejo de input file con extensiones permitidas
  if (field.type === "file") {
    const input = document.createElement("input");
    input.type = "file";
    input.name = field.name;
    input.className = field.className || "";
    input.required = field.required || false;

    if (field.multiple) {
      input.setAttribute("multiple", "");
    }

    // Validar extensiones permitidas
    if (
      Array.isArray(field.allowedExtensions) &&
      field.allowedExtensions.length > 0
    ) {
      input.accept = field.allowedExtensions.map((ext) => `.${ext}`).join(",");
    }

    fieldContainer.appendChild(input);
  }

  // Manejo de extraContent (debe agregarse al final del contenedor principal)
  if (field.extraContent) {
    const extraContentContainer = document.createElement("div");
    extraContentContainer.innerHTML = field.extraContent;
    fieldContainer.appendChild(extraContentContainer);
  }

  return fieldContainer;
}

export function destroyExistingModal() {
  const existingModal = document.querySelector(".ui.modal");
  if (existingModal) {
    existingModal.remove();
  }
}

export function closeModal() {
  $(".ui.modal").modal("hide");
}
