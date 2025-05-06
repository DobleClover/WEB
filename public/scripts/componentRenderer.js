import { userLogged } from "./checkForUserLogged.js";
import {
  brandsFromDB,
  categoriesFromDB,
  colorsFromDB,
  countriesFromDB,
  dropsFromDB,
  paymentTypesFromDB,
  provincesFromDB,
  setBrands,
  setCategories,
  setColors,
  setCountries,
  setProvinces,
  setSizes,
  settingsFromDB,
  sizesFromDB,
  statusesFromDB,
} from "./fetchEntitiesFromDB.js";
import { getLocalStorageItem } from "./localStorage.js";
import {
  handleAddressModalActions,
  handleBrandModalActions,
  handleColorModalActions,
  handleDropModalActions,
  handlePhoneModalActions,
  handleProductModalActions,
  handleUserLoginModal,
  handleUserSignUpModal,
} from "./modalHandlers.js";
import {
  listenToBrandFileInputs,
  listenToFileInput,
  loadExistingImages,
  paintImgInContainer,
  updateImages,
} from "./userProfile.js";
import {
  activateCheckboxTogglers,
  activateDropdown,
  displayBigNumbers,
  generateRandomString,
  getDateString,
  getProductImageSizeUrl,
  getProductMainImage,
  handleNewAddressButtonClick,
  handleNewPhoneButtonClick,
  handlePageModal,
  handleRemoveAddressButtonClick,
  handleRemovePhoneButtonClick,
  handleUserSignUpClick,
  handleInputFileFromModal,
  toggleInputPasswordType,
  getDeepCopy,
  productsFromDB,
  updateProductTable,
  showCardMessage,
  checkForNumericInputs,
  checkForFloatInputs,
  checkForSelectFinders,
  initiateColorDropdown,
  setProductsFromDB,
  updateBrandTable,
  updateColorTable,
  checkForAutoselectInputs,
  saveSetting,
  getImgElement,
  minDecimalPlaces,
  displayPriceNumber,
} from "./utils.js";

export function createProductCard(props) {
  let { id, name, brand, price, files, discount } = props;

  // Crear elementos
  const card = document.createElement("a");
  card.className = `card product_card ${discount ? "discount_card" : ""}`; //animated_element
  card.href = `/producto/${id}`;

  const imagesWrapper = document.createElement("div");
  imagesWrapper.className = "card_images_wrapper";

  const cardImage = document.createElement("div");
  cardImage.className = "product_card_image";

  const mainImageObj = files.find((file) => file.main_file) || files[0];
  cardImage.style.backgroundImage = `url(${mainImageObj.thumb_url})`;
  let mainImage;
  if (mainImageObj && mainImageObj.file_urls) {
    mainImage = getImgElement(
      mainImageObj,
      "product_card_image product_card_main_image product_card_active_img"
    );
  }
  const hoveredImage = document.createElement("img");
  hoveredImage.className =
    "card_alternative_image product_card_main_image card_image_active";
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
  otherImagesContainer.className = "product_card_other_image ";

  files.forEach((file) => {
    if (file.main_file) return;
    const otherImage = getImgElement(file, "product_card_image");
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
  cardCategory.className = "product_card_category";
  cardCategory.textContent = brand.name;
  const priceInARS = displayPriceNumber(price);
  const cardPrice = document.createElement("div");
  cardPrice.className = `card_price product_card_price`;
  cardPrice.textContent = `$${priceInARS}`;
  let discountedPrice;
  if (discount) {
    discountedPrice = document.createElement("div");
    discountedPrice.className = `card_price product_card_price discount_price`;
    let priceWithDiscount = (1 - parseInt(discount) / 100) * parseFloat(price);
    discountedPrice.textContent = `$${displayPriceNumber(priceWithDiscount)}`;
    cardPrice.textContent = "";
    const originalPrice = document.createElement("span");
    originalPrice.className = "original_price";
    originalPrice.textContent = `$${priceInARS}`;
    cardPrice.appendChild(originalPrice); // Agregarlo junto al precio original
    // Crear el elemento para mostrar el porcentaje de descuento
    const discountInfo = document.createElement("span");
    discountInfo.className = "discount_info";
    discountInfo.textContent = ` ${discount}% OFF`;
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

export function createDobleusoProductCard(props) {
  let { id, name, price, files, discount } = props;

  const card = document.createElement("a");
  card.href = `/producto/${id}`;
  card.className = "dobleuso_product_card";

  const badge = document.createElement("div");
  badge.className = "dobleuso_badge";
  badge.textContent = "DobleUso";
  card.appendChild(badge);

  const imageContainer = document.createElement("div");
  imageContainer.className = "dobleuso_product_image_container";

  const mainImageObj = files.find((file) => file.main_file) || files[0];
  const img = document.createElement("img");
  img.src =
    mainImageObj.file_urls?.find((f) => f.size === "1x")?.url ||
    mainImageObj.thumb_url;
  img.alt = name;
  img.className = "dobleuso_product_image";

  imageContainer.appendChild(img);
  card.appendChild(imageContainer);

  const info = document.createElement("div");
  info.className = "dobleuso_product_info";

  const productName = document.createElement("h3");
  productName.className = "dobleuso_product_name";
  productName.textContent = name;

  const priceContainer = document.createElement("div");
  priceContainer.className = "dobleuso_price_container";
  const priceInARS = displayPriceNumber(price);
  if (discount) {
    const originalPrice = document.createElement("span");
    originalPrice.className = "dobleuso_price_original";
    originalPrice.textContent = `$${priceInARS}`;

    const discountedValue = price * (1 - discount / 100);
    const discountedPrice = document.createElement("span");
    discountedPrice.className = "dobleuso_price_discounted";
    discountedPrice.textContent = `$${displayPriceNumber(discountedValue)}`;

    const discountLabel = document.createElement("span");
    discountLabel.className = "dobleuso_discount_label";
    discountLabel.textContent = `${discount}% OFF`;

    priceContainer.appendChild(originalPrice);
    priceContainer.appendChild(discountedPrice);
    priceContainer.appendChild(discountLabel);
  } else {
    const productPrice = document.createElement("p");
    productPrice.className = "dobleuso_product_price";
    productPrice.textContent = `$${priceInARS}`;
    priceContainer.appendChild(productPrice);
  }

  const productButton = document.createElement("div");
  productButton.className = "dobleuso_product_button";
  productButton.innerHTML = "<span class='icon'>✔</span> SELECCIONAR OPCIONES";

  info.appendChild(productName);
  info.appendChild(priceContainer);
  info.appendChild(productButton);

  card.appendChild(info);

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
          className: "ui button right floated basic green submit sign-up-btn",
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
          text: "Registrarse",
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
  buttonContainer.className = "field margin_field";

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
  if (field.type === "date" || field.type === "datetime-local") {
    const input = document.createElement("input");
    input.type = field.type;
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

export function formatDateTimeForInput(dateString) {
  const date = new Date(dateString);

  // Obtener los componentes de la fecha
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Mes comienza desde 0
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function checkoutCard(props) {
  const productFromDB = props;
  const productMainFile = productFromDB.files?.find((file) => file.main_file);
  props.quantity = props.quantity || 1;
  const container = document.createElement("div");
  container.className = "card checkout-card";
  container.dataset.variations_id = props.variations_id;
  const productPrice = productFromDB.price;
  // Image section
  const imageDiv = document.createElement("div");
  imageDiv.className = "card_image";

  const img = document.createElement("img");

  // Configurar el srcset y src del elemento img usando productMainFile
  if (productMainFile?.file_urls?.length) {
    const fileUrls = productMainFile.file_urls
      .map((url) => `${url.url} ${url.size}`)
      .join(", ");
    img.srcset = fileUrls;
    img.src =
      productMainFile.file_urls[productMainFile.file_urls.length - 1].url;
    img.alt = productMainFile.filename; // Usar el nombre del archivo para alt
    // img.dataset.file_id = productMainFile.id; // Agregar un data attribute
    img.loading = "lazy"; // Cargar la imagen de manera perezosa
  } else {
    img.src = "/img/product/default.png";
    let randomNumber = generateRandomString(10);
    img.alt = `default-image-${randomNumber}`; // Usar el nombre del archivo para alt
  }

  imageDiv.appendChild(img);

  // Content section
  const contentDiv = document.createElement("div");
  contentDiv.className = "card_content";

  // Header
  const header = document.createElement("a");
  header.className = "card_header";
  header.href = `/producto/${productFromDB.id}`; // Puedes parametrizar este enlace si es necesario
  header.textContent = productFromDB.name;

  // Meta
  const metaCategoryDiv = document.createElement("div");
  metaCategoryDiv.className = "meta";
  let categorySpan = document.createElement("span");
  categorySpan.className = "card_desc";
  categorySpan.textContent = productFromDB.category?.name;
  metaCategoryDiv.appendChild(categorySpan);

  const metaVariationDiv = document.createElement("div");
  metaVariationDiv.className = "meta";
  categorySpan = document.createElement("span");
  categorySpan.className = "card_desc";
  categorySpan.textContent = `Color: ${props.colorFromDB?.name} ||Talle: ${props.sizeFromDB?.size}`;
  metaVariationDiv.appendChild(categorySpan);

  // Price
  // Price
  let hasDiscount = productFromDB.discount > 0;
  let priceWrapper, priceSpan;

  if (hasDiscount) {
    container.classList.add("discounted_card");

    const originalPrice = document.createElement("span");
    originalPrice.className = "card_price original_price";
    originalPrice.textContent = `$${displayPriceNumber(productFromDB.price)}`;

    const discountedPrice = document.createElement("span");
    discountedPrice.className = "card_price discounted_price";
    discountedPrice.textContent = `$${displayPriceNumber(
      productFromDB.discounted_price
    )}`;

    priceWrapper = document.createElement("div");
    priceWrapper.className = "price_wrapper";
    priceWrapper.appendChild(originalPrice);
    priceWrapper.appendChild(discountedPrice);
    contentDiv.appendChild(priceWrapper);
  } else {
    priceSpan = document.createElement("span");
    priceSpan.className = "card_price";
    priceSpan.textContent = `$${displayPriceNumber(productFromDB.price)}`;
    contentDiv.appendChild(priceSpan);
  }

  // Amount container
  const amountContainer = document.createElement("div");
  amountContainer.className = "card_amount_container";

  const trashIcon = document.createElement("i");
  trashIcon.className = `trash alternate outline icon remove_card_btn ${
    props.quantity <= 1 ? "" : "hidden"
  }`;

  const quantitySpan = document.createElement("span");
  quantitySpan.className = "card_product_amount";
  quantitySpan.textContent = props.quantity;

  const addButton = document.createElement("button");
  const removeButton = document.createElement("button");
  removeButton.className = `ui button number_button remove_more_product ${
    props.quantity > 1 ? "" : "hidden"
  }`;
  addButton.className = `ui button number_button add_more_product ${
    props.quantity == props.maxQuantityAvailable ? "disabled" : ""
  }`;

  const plusIcon = document.createElement("i");
  const minusIcon = document.createElement("i");
  plusIcon.className = "plus icon";
  minusIcon.className = "minus icon";
  removeButton.appendChild(minusIcon);
  addButton.appendChild(plusIcon);

  // Append children
  amountContainer.appendChild(trashIcon);
  amountContainer.appendChild(removeButton);
  amountContainer.appendChild(quantitySpan);
  amountContainer.appendChild(addButton);

  contentDiv.appendChild(header);
  contentDiv.appendChild(metaCategoryDiv);
  contentDiv.appendChild(metaVariationDiv);
  contentDiv.appendChild(hasDiscount ? priceWrapper : priceSpan);
  contentDiv.appendChild(amountContainer);

  // Append all to container
  container.appendChild(imageDiv);
  container.appendChild(contentDiv);
  container.innerHTML += `<div class="ui dimmer">
    <div class="ui loader"></div>
  </div>`;
  return container;
}

export function addressCard(props) {
  // Crear el contenedor principal con clases y data-id
  const card = document.createElement("div");
  card.className = "card address_card";
  card.setAttribute("data-id", props?.id);

  // Si props es undefined, pintar el "+" y texto centrado
  if (!props) {
    card.classList.add("card_empty"); // Agregar clase opcional para estilos específicos

    // Crear el contenido centrado
    const addIcon = document.createElement("div");
    addIcon.className = "add_icon";
    addIcon.textContent = "+";

    const addText = document.createElement("p");
    addText.className = "add_text";
    addText.textContent = "Agregar"; // Basado en la variable global

    card.appendChild(addIcon);
    card.appendChild(addText);

    return card; // Retornar la tarjeta con contenido centrado
  }
  // Crear la sección superior de la tarjeta
  const cardTopContent = document.createElement("div");
  cardTopContent.className = "card_top_content";

  const cardHeader = document.createElement("p");
  cardHeader.className = "card_header address_name";
  cardHeader.textContent = props.label;

  const defaultAddressMarker = document.createElement("div");
  defaultAddressMarker.className = `default_address_marker ${
    props.default ? "default_marker_active" : ""
  } default_marker default_absolute_marker`;

  cardTopContent.appendChild(cardHeader);
  cardTopContent.appendChild(defaultAddressMarker);

  // Crear la sección de contenido de la tarjeta
  const cardContent = document.createElement("div");
  cardContent.className = "card_content";

  const street = document.createElement("p");
  street.className = "card_text address_street";
  street.textContent = props.street;

  const detail = document.createElement("p");
  detail.className = "card_text address_detail";
  detail.textContent = props.detail;

  const zip = document.createElement("p");
  zip.className = "card_text";
  zip.innerHTML = `CP: <span class="address_zip">${props.zip_code}</span>`;

  const city = document.createElement("p");
  city.className = "card_text address_city";
  city.textContent = `${props.city}, ${props.province?.name || ""}`;

  cardContent.appendChild(street);
  cardContent.appendChild(detail);
  cardContent.appendChild(zip);
  cardContent.appendChild(city);

  // Crear la sección inferior de la tarjeta
  const cardBottomContainer = document.createElement("div");
  cardBottomContainer.className = "card_botton_container";

  const editLink = document.createElement("p");
  editLink.className = "card_link edit_address_card_btn";
  editLink.textContent = "Editar";
  editLink.addEventListener(
    "click",
    async () => await handleNewAddressButtonClick(props)
  );

  const deleteLink = document.createElement("p");
  deleteLink.className = "card_link destroy_address_card_btn";
  deleteLink.textContent = "Eliminar";
  deleteLink.addEventListener(
    "click",
    async () => await handleRemoveAddressButtonClick(props)
  );

  cardBottomContainer.appendChild(editLink);
  cardBottomContainer.appendChild(deleteLink);

  // Ensamblar la tarjeta
  card.appendChild(cardTopContent);
  card.appendChild(cardContent);
  card.appendChild(cardBottomContainer);

  return card;
}

export function phoneCard(props) {
  // Crear el contenedor principal con clases y data-id
  const card = document.createElement("div");
  card.className = "card phone_card";
  card.setAttribute("data-id", props?.id);

  // Si props es undefined, pintar el "+" y texto centrado
  if (!props) {
    card.classList.add("card_empty"); // Agregar clase opcional para estilos específicos

    // Crear el contenido centrado
    const addIcon = document.createElement("div");
    addIcon.className = "add_icon";
    addIcon.textContent = "+";

    const addText = document.createElement("p");
    addText.className = "add_text";
    addText.textContent = "Agregar"; // Basado en la variable global

    card.appendChild(addIcon);
    card.appendChild(addText);

    return card; // Retornar la tarjeta con contenido centrado
  }

  // Crear el marcador de teléfono predeterminado
  const defaultPhoneMarker = document.createElement("div");
  defaultPhoneMarker.className = `default_phone_marker default_marker ${
    props.default ? "default_marker_active" : ""
  } default_absolute_marker`;

  // Crear la sección de contenido de la tarjeta
  const cardContent = document.createElement("div");
  cardContent.className = "card_content";

  const phoneNumber = document.createElement("p");
  phoneNumber.className = "card_text phone_number";
  phoneNumber.textContent = `(+${props.country?.code}) ${props.phone_number}`;

  const phoneCountry = document.createElement("p");
  phoneCountry.className = "card_text phone_country";
  phoneCountry.textContent = props?.country?.name;

  cardContent.appendChild(phoneNumber);
  cardContent.appendChild(phoneCountry);

  // Crear la sección inferior de la tarjeta
  const cardBottomContainer = document.createElement("div");
  cardBottomContainer.className = "card_botton_container";

  const editLink = document.createElement("p");
  editLink.className = "card_link edit_phone_card_btn";
  editLink.textContent = "Editar";
  editLink.addEventListener(
    "click",
    async () => await handleNewPhoneButtonClick(props)
  );

  const deleteLink = document.createElement("p");
  deleteLink.className = "card_link destroy_phone_card_btn";
  deleteLink.textContent = "Eliminar";
  deleteLink.addEventListener(
    "click",
    async () => await handleRemovePhoneButtonClick(props)
  );

  cardBottomContainer.appendChild(editLink);
  cardBottomContainer.appendChild(deleteLink);

  // Ensamblar la tarjeta
  card.appendChild(defaultPhoneMarker);
  card.appendChild(cardContent);
  card.appendChild(cardBottomContainer);

  return card;
}

export function orderCard(order) {
  const container = document.createElement("div");
  container.className = "card order_card";
  container.dataset.db_id = order.id || "";

  // Top content: Fecha y estado de la orden
  const topContentDiv = document.createElement("div");
  topContentDiv.className = "card_top_content";

  const dateParagraph = document.createElement("p");
  dateParagraph.className = "card_date";
  const orderDateString = getDateString(order.createdAt);

  dateParagraph.textContent = orderDateString;

  const statusParagraph = document.createElement("p");
  statusParagraph.className = `card_status ${order.orderStatus.class}`;
  statusParagraph.textContent = order.orderStatus?.status; // Función para convertir el ID de estado en texto

  topContentDiv.appendChild(dateParagraph);
  topContentDiv.appendChild(statusParagraph);

  // Items de la orden
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "card_items_container";

  order.orderItems?.forEach((orderItem, i) => {
    const itemContainer = document.createElement("div");
    itemContainer.className = "card_order_item_container";

    // Imagen del producto
    const imageDiv = document.createElement("div");
    imageDiv.className = "card_image";

    const img = document.createElement("img");
    const imgSrc = orderItem?.variation?.product?.files[0]?.file_urls[0].url;
    if (imgSrc) {
      img.src = imgSrc;
      img.alt = orderItem.name || `Producto-${i}`;
      img.loading = "lazy";
    } else {
      img.src = "/img/product/default.png";
      img.alt = "Default product image";
    }
    imageDiv.appendChild(img);

    // Contenido del producto
    const contentDiv = document.createElement("div");
    contentDiv.className = "card_content";

    const header = document.createElement("p");
    header.className = "card_header";
    header.textContent = `${orderItem.name || "Producto sin nombre"} (${
      orderItem.quantity
    })`;

    const metaCategoryDiv = document.createElement("div");
    metaCategoryDiv.className = "meta";
    const categorySpan = document.createElement("span");
    categorySpan.className = "card_desc";
    const categoryName = orderItem?.product?.category
      ? orderItem?.product?.category?.name
      : "";

    categorySpan.textContent = categoryName;
    metaCategoryDiv.appendChild(categorySpan);

    const metaVariationDiv = document.createElement("div");
    metaVariationDiv.className = "meta";
    const variationSpan = document.createElement("span");
    variationSpan.className = "card_desc";
    variationSpan.textContent = `Color: ${orderItem.color || "N/A"} || Talle: ${
      orderItem.size || "N/A"
    }`;
    metaVariationDiv.appendChild(variationSpan);

    const priceSpan = document.createElement("span");
    priceSpan.className = "card_price";
    priceSpan.textContent = `$${displayBigNumbers((orderItem.quantity * orderItem.price).toFixed(
      2
    ),2)}`;

    // Agregar todos los elementos al contenedor de contenido
    contentDiv.appendChild(header);
    contentDiv.appendChild(metaCategoryDiv);
    contentDiv.appendChild(metaVariationDiv);
    contentDiv.appendChild(priceSpan);

    // Agregar imagen y contenido al contenedor del ítem
    itemContainer.appendChild(imageDiv);
    itemContainer.appendChild(contentDiv);

    // Agregar el ítem al contenedor principal de ítems
    itemsContainer.appendChild(itemContainer);
  });

  // Agregar todo al contenedor principal
  container.appendChild(topContentDiv);
  container.appendChild(itemsContainer);

  return container;
}

// Función auxiliar para convertir el ID de estado en texto
function getStatus(statusId) {
  switch (statusId) {
    case 1:
      return "Pendiente";
    case 2:
      return "En proceso";
    case 3:
      return "Enviado";
    case 4:
      return "Entregado";
    default:
      return "Desconocido";
  }
}

export function homeLabel(props) {
  // Crear el contenedor principal
  const accordion = document.createElement("div");
  accordion.className = "ui styled fluid accordion home_label";

  // Crear el título
  const title = document.createElement("div");
  title.className = "title";

  const icon = document.createElement("i");
  icon.className = "dropdown icon";

  const titleText = document.createTextNode(props.name);

  title.appendChild(icon);
  title.appendChild(titleText);

  // Crear el contenido
  const content = document.createElement("div");
  content.className = "content";

  // Verificar si desc tiene más de un elemento
  if (Array.isArray(props.desc) && props.desc.length > 1) {
    const ul = document.createElement("ul");
    props.desc.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    const paragraph = document.createElement("p");
    paragraph.appendChild(ul);
    content.appendChild(paragraph);
  } else {
    const paragraph = document.createElement("p");
    paragraph.className = "transition hidden";
    paragraph.textContent = Array.isArray(props.desc)
      ? props.desc[0]
      : props.desc;
    content.appendChild(paragraph);
  }

  // Ensamblar el contenedor
  accordion.appendChild(title);
  accordion.appendChild(content);

  return accordion;
}

export function form(props) {
  const {
    formClasses,
    inputProps,
    formTitleObject,
    formAction,
    method,
    buttonProps,
  } = props;
  const container = document.createElement("div");
  container.className = "form_container";

  const h3Element = document.createElement("h3");
  h3Element.className = "page_title red";
  h3Element.textContent = formTitleObject?.title;
  if (formTitleObject?.datasetObject) {
    const { dataKey, dataValue } = formTitleObject?.datasetObject;
    h3Element.dataset[dataKey] = dataValue;
  }
  container.appendChild(h3Element);

  const form = document.createElement("form");
  form.action = formAction;
  form.method = method || "POST";
  form.className = `custom_form ${formClasses || ""}`;
  container.appendChild(form);

  inputProps.forEach((input) => {
    const inputContainer = document.createElement("div");
    inputContainer.className = `input_container ${input.contClassNames}`;
    inputContainer.style.width = `${input.width}%`;

    let inputElement;

    if (input.type === "select") {
      // Crear un elemento select
      inputElement = document.createElement("select");
      inputElement.name = input.name || "";
      inputElement.required = input.required || false;
      inputElement.className = `form-select ${input.inpClassNames || ""}`;
      if (input.id) inputElement.id = input.id;

      // Agregar opciones al select
      (input.options || []).forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value || "";
        optionElement.textContent = option.label || "";
        optionElement.selected = option.selected;
        optionElement.disabled = option.disabled;
        inputElement.appendChild(optionElement);
      });
    } else {
      let randomString = generateRandomString(5); //Esto es para que targetee bien
      // Crear un elemento input (por defecto)
      inputElement = document.createElement("input");
      inputElement.type = input.type || "text";
      inputElement.placeholder = input.placeholder || "";
      inputElement.value = input.value || "";
      inputElement.id = input.id || randomString;
      inputElement.name = input.name || "";
      inputElement.required = input.required || false;
      inputElement.className = `form-input ${input.className || ""}`;
    }
    let label = undefined;
    if (input.label) {
      label = document.createElement("label");
      label.textContent = input.label;
      label.htmlFor = inputElement.id || "";
    }
    if (inputElement.type == "checkbox") {
      //Los agrego al reves y agrego la clase checkbox-container
      inputContainer.classList.add("checkbox-container");
      inputContainer.appendChild(inputElement);
      label && inputContainer.appendChild(label);
    } else if (input.type === "switchCheckbox") {
      inputElement.type = "checkbox";
      // Manejo de switchCheckbox
      const toggleContainer = document.createElement("div");
      toggleContainer.className = "ui toggle checkbox";
      inputElement.classList.add("hidden");
      inputElement.tabIndex = 0;

      toggleContainer.appendChild(inputElement);
      label && toggleContainer.appendChild(label);

      inputContainer.appendChild(toggleContainer);
    } else {
      label && inputContainer.appendChild(label);
      inputContainer.appendChild(inputElement);
    }

    form.appendChild(inputContainer);
  });
  // Crear botones
  if (Array.isArray(buttonProps)) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button_container";

    buttonProps.forEach((button) => {
      const btn = document.createElement("button");
      btn.type = button.type || "button";
      btn.className = `ui button ${button.className || ""}`;
      btn.textContent = button.text || "Button";
      if (button.onClick && typeof button.onClick === "function") {
        btn.addEventListener("click", button.onClick);
      }
      buttonContainer.appendChild(btn);
    });

    form.appendChild(buttonContainer);
  }
  return container;
}

export function createUserMenuBtn(props) {
  // Obtener la URL actual
  const currentUrl = window.location.pathname;

  // Crear el contenedor principal
  const container = document.createElement("div");
  container.className = "ui icon top right pointing dropdown user_menu_btn";

  // Agregar el ícono de menú
  const barsIcon = document.createElement("i");
  barsIcon.className = props.items[0].itemLogo;
  container.appendChild(barsIcon);

  // Crear el menú
  const menu = document.createElement("div");
  menu.className = "menu";

  // Agregar encabezado según el tipo
  const header = document.createElement("div");
  header.className = "header";
  if (props.type == 2) {
    //user
    header.textContent = "Configuracion";
  } else {
    //admin
    header.textContent = "Dashboard";
  }

  menu.appendChild(header);

  // Crear los elementos del menú
  props.items.forEach((item, i) => {
    const itemLink = document.createElement("a");
    itemLink.className = `item`;
    itemLink.dataset.index = i;
    itemLink.dataset.label = item.itemType;

    // Agregar clases adicionales si el tipo coincide con la URL actual
    if (props.actualIndexSelected == i)
      itemLink.classList.add("active", "selected");

    // Establecer el logo e ícono
    const icon = document.createElement("i");
    icon.className = item.itemLogo;
    itemLink.appendChild(icon);

    // Agregar el tooltip
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = item.itemLabel;
    itemLink.appendChild(tooltip);

    // Agregar el enlace al menú
    menu.appendChild(itemLink);
  });

  // Agregar el enlace de cierre de sesión
  const logoutLink = document.createElement("a");
  logoutLink.href = "/logout";
  logoutLink.className = "item logout-item";

  const logoutIcon = document.createElement("i");
  logoutIcon.className = "bx bx-door-open";
  logoutLink.appendChild(logoutIcon);

  const logoutTooltip = document.createElement("span");
  logoutTooltip.className = "tooltip";
  logoutTooltip.textContent = "Cerrar Sesion";
  logoutLink.appendChild(logoutTooltip);

  menu.appendChild(logoutLink);

  // Agregar el menú al contenedor
  container.appendChild(menu);

  // Insertar el contenedor en el DOM
  return container;
}

export async function createPhoneModal(phone) {
  try {
    let buttonText, headerText;
    if (phone) {
      buttonText = "Actualizar";
      headerText = "Actualizar Telefono";
    } else {
      buttonText = "Crear";
      headerText = "Agregar Telefono";
    }
    createModal({
      headerTitle: headerText,
      formFields: [
        {
          type: "two-fields",
          fields: [
            {
              label: "Codigo de area",
              type: "select",
              name: "phone_countries_id",
              className:
                "ui search dropdown country_code_search_input form_search_dropdown",
              value: phone ? phone.countries_id : "",
              required: true,
            },
            {
              label: "Numero de telefono",
              type: "text",
              className: "numeric_only_input",
              name: "phone_number",
              value: phone ? phone.phone_number : "",
              required: true,
            },
          ],
        },
        {
          label: "Telefono Predeterminado",
          type: "toggle",
          name: "phone_default",
          containerClassName: `${!userLogged ? "hidden" : ""}`,
          required: true,
          checked: phone ? phone.default : !userLogged?.phones?.length,
        },
      ],
      buttons: [
        {
          text: buttonText,
          className: "ui button submit green send-modal-form-btn",
          onClick: async () => await handlePhoneModalActions(phone),
        },
      ],
      id: phone ? phone.id : undefined,
    });
    activateCheckboxTogglers();
    //Una vez creado el modal, activo con los paises
    if (!countriesFromDB.length) {
      await setCountries();
    }
    let classNameToActivate =
      ".ui.search.dropdown.country_code_search_input.form_search_dropdown";
    let arrayToActivateInDropdown = countriesFromDB
      ?.filter((count) => count.code)
      ?.map((country) => ({
        id: country.id,
        name: `+${country.code} (${country.name})`,
      }));

    // Ahora activo el select
    activateDropdown({
      className: classNameToActivate,
      array: arrayToActivateInDropdown,
      placeHolder: "Codigo de area",
      values: phone ? phone?.country?.id : [],
    });
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}

export async function createAddressModal(address = undefined) {
  try {
    let buttonText, headerText;
    if (address) {
      buttonText = "Actualizar";
      headerText = "Actualizar Direccion";
    } else {
      buttonText = "Crear";
      headerText = "Agregar Direccion";
    }

    createModal({
      headerTitle: headerText,
      formFields: [
        {
          label: "Etiqueta",
          type: "text",
          name: "address_label",
          className: "",
          required: true,
          value: address ? address.label : "",
          placeHolder: "Etiqueta (ej: Casa)",
        },
        {
          label: "Direccion",
          type: "text",
          name: "address_street",
          className: "",
          required: true,
          value: address ? address.street : "",
          placeHolder: "Direccion completa",
        },
        {
          label: "Detalle",
          type: "text",
          name: "address_detail",
          className: "",
          required: false,
          value: address ? address.detail || "" : "",
          placeHolder: "Detalle (ej: 2b, apt 300)",
        },
        {
          label: "Codigo Postal",
          type: "text",
          name: "address_zip",
          className: "short-input",
          required: true,
          value: address ? address.zip_code : "",
          placeHolder: "Codigo postal",
        },
        {
          label: "Ciudad",
          type: "text",
          name: "address_city",
          className: "",
          required: true,
          value: address ? address.city : "",
          placeHolder: "Ciudad",
        },
        {
          label: "Provincia",
          type: "select",
          name: "address_provinces_id",
          className:
            "ui search dropdown province_search_input form_search_dropdown",
          required: true,
          value: address ? address.provinces_id : "",
          placeHolder: "Elegi una provinicia",
        },
        {
          label: "Direccion predeterminada",
          type: "toggle",
          name: "address-default",
          containerClassName: `${!userLogged ? "hidden" : ""}`,
          required: true,
          checked: address ? address.default : !userLogged?.addresses?.length,
        },
      ],

      buttons: [
        {
          text: buttonText,
          className: "ui button submit green send-modal-form-btn",
          onClick: async () => await handleAddressModalActions(address),
        },
      ],
      id: address ? address.id : undefined,
    });
    activateCheckboxTogglers();
    //Una vez creado el modal, activo con los paises
    if (!provincesFromDB.length) {
      await setProvinces();
    }
    //Aca los paises van solo nombre
    let arrayToActivateInDropdown = provincesFromDB.map((dbProv) => ({
      id: dbProv.id,
      name: dbProv.name,
    }));
    let classToActivate =
      ".ui.search.dropdown.province_search_input.form_search_dropdown";
    // Ahora activo el select
    activateDropdown({
      className: classToActivate,
      array: arrayToActivateInDropdown,
      placeHolder: "Elegi una provincia",
      values: address ? [address.provinces_id] : [],
    });
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}

export function userInfoComponent(props) {
  const { first_name, last_name, email } = props;

  // Crear el contenedor principal
  const container = document.createElement("div");
  container.className = "user_info_container";

  // Crear el círculo con las iniciales del usuario
  const initials = `${(first_name?.charAt(0) || "").toUpperCase()}${(
    last_name?.charAt(0) || ""
  ).toUpperCase()}`;
  const initialsCircle = document.createElement("p");
  initialsCircle.className = "user_initials_circle";
  initialsCircle.textContent = initials || "N/A"; // Muestra 'N/A' si no hay iniciales

  // Crear el campo de email
  const emailField = document.createElement("div");
  emailField.className = "user_email_field";

  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Email";

  const emailText = document.createElement("p");
  emailText.className = "user-email";
  emailText.textContent = email; // Muestra un mensaje si no hay email

  // Ensamblar el campo de email
  emailField.appendChild(emailLabel);
  emailField.appendChild(emailText);

  // Ensamblar el contenedor principal
  container.appendChild(initialsCircle);
  container.appendChild(emailField);

  return container;
}

export function generateUserLoggedDropdown() {
  const dropdownContainer = document.createElement("li");
  dropdownContainer.className =
    "ui menu header_dropdown user_action_item user_initials_container";

  const dropdownTrigger = document.createElement("a");
  dropdownTrigger.className = "browse item header_nav_letter";

  const initialsSpan = document.createElement("span");
  initialsSpan.className = "user_initials";
  initialsSpan.textContent = userLogged.initials;

  dropdownTrigger.appendChild(initialsSpan);

  const popupContainer = document.createElement("div");
  popupContainer.className =
    "ui fluid popup header_dropdown_items_section bottom left transition hidden";

  const columnDiv = document.createElement("div");
  columnDiv.className = "ui column";

  const header = document.createElement("h4");
  header.className = "ui header";
  header.textContent = "Menu";

  const listDiv = document.createElement("div");
  listDiv.className = "ui link list user_logged_list";
  const isAdmin = userLogged.user_roles_id == 1;
  let items;
  if (isAdmin) {
    items = [
      { text: "Ventas", href: "/perfil?index=0" },
      { text: "Productos", href: "/perfil?index=1" },
      { text: "Marcas, Drops & Envios", href: "/perfil?index=2" },
      { text: "Ajustes", href: "/perfil?index=3" },
      {
        text: "Cerrar sesión",
        href: "/logout",
        logoutItem: true,
      },
    ];
  } else {
    items = [
      { text: "Perfil", href: "/perfil?index=0" },
      {
        text: "Mis Direcciones",
        href: "/perfil?index=1",
      },
      {
        text: "Mis Telefonos",
        href: "/perfil?index=2",
      },
      {
        text: "Mis Compras",
        href: "/perfil?index=3",
      },
      {
        text: "Cerrar sesión",
        href: "/logout",
        logoutItem: true,
      },
    ];
  }

  items.forEach((item) => {
    const link = document.createElement("a");
    link.className = "item user-anchors";
    link.href = item.href;
    link.textContent = item.text;
    listDiv.appendChild(link);
    if (item.logoutItem) link.className += " logout-item";
  });

  columnDiv.appendChild(header);
  columnDiv.appendChild(listDiv);
  popupContainer.appendChild(columnDiv);
  dropdownContainer.appendChild(dropdownTrigger);
  dropdownContainer.appendChild(popupContainer);

  return dropdownContainer;
}

export const createLoadingSpinner = (optionalClassName) => {
  const loadingState = document.createElement("div");
  loadingState.className = `loading-state ${optionalClassName}`;
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-circle";
  loadingState.appendChild(loadingSpinner);
  return loadingState;
};

export function generateVariationField(colorVariations = []) {
  const colorId = colorVariations.length ? colorVariations[0].colors_id : null;

  // Crear el contenedor principal
  const container = document.createElement("div");
  container.classList.add(
    "ui",
    "segment",
    "field",
    "margin_field",
    "variation_field"
  );

  // Crear el icono de eliminar
  const removeIcon = document.createElement("i");
  removeIcon.classList.add("bx", "bx-x", "remove_variation_btn", "remove_btn");

  // Crear el campo de selección de color
  const variationHeaderField = document.createElement("div");
  variationHeaderField.classList.add("field", "variation_header_field");

  const colorLabel = document.createElement("label");
  colorLabel.textContent = "Color";

  const colorSelect = document.createElement("select");
  colorSelect.name = "variation_colors_id";
  colorSelect.required = true;
  colorSelect.dataset.array_name = "colorsFromDB";
  colorSelect.dataset.entity_name = "Color";
  colorSelect.className =
    "ui search dropdown color_search_input form_search_dropdown";

  variationHeaderField.appendChild(colorLabel);
  variationHeaderField.appendChild(colorSelect);

  // Crear el botón "Agregar Color"
  const addSizeButtonField = document.createElement("div");
  addSizeButtonField.classList.add(
    "field",
    "margin_field",
    "add_size_button_field"
  );

  const addButton = document.createElement("button");
  addButton.className = "ui button basic green tiny";
  addButton.textContent = "Agregar Talle";
  addButton.type = "button";

  addSizeButtonField.appendChild(addButton);

  // Crear el contenedor de tallas (donde se agregarán los tamaños)
  const variationSizesWrapper = document.createElement("div");
  variationSizesWrapper.classList.add("field", "variation_sizes_wrapper");

  // Agregar todos los elementos al contenedor principal
  container.appendChild(removeIcon);
  container.appendChild(variationHeaderField);
  container.appendChild(addSizeButtonField);
  container.appendChild(variationSizesWrapper);

  if (colorVariations?.length) {
    // Generar variaciones de tallas para este color
    colorVariations.forEach((sizeStockVar) => {
      let sizeVariationElement = generateVariationSizeContainer({
        variation: sizeStockVar,
        colorParentID: undefined,
      });
      variationSizesWrapper.appendChild(sizeVariationElement);
    });
  }
  return container;
}

export function generateVariationSizeContainer({ variation = undefined }) {
  // Obtener la categoría del producto
  const productCategory = parseInt(
    document.querySelector('select[name="product_categories_id"]').value
  );

  // Filtrar los sizes según la categoría seleccionada antes del .map()
  const sizeOptions = sizesFromDB
    .filter((size) => size.categories.includes(productCategory)) // Filtrar por categoría
    .map((size) => ({
      value: size.id,
      text: size.size,
    }));

  // Crear el contenedor principal
  const container = document.createElement("div");
  container.classList.add("variation_size_container");

  // Crear el icono de eliminar
  const removeIcon = document.createElement("i");
  removeIcon.classList.add("bx", "bx-x", "remove-size-btn", "remove_btn");

  // Crear el primer field (Size)
  const sizeField = document.createElement("div");
  sizeField.classList.add("field");

  const sizeLabel = document.createElement("label");
  sizeLabel.textContent = "Size";

  const sizeSelect = document.createElement("select");
  sizeSelect.name = "variation_sizes_id";
  sizeOptions.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.text;
    sizeSelect.appendChild(option);
  });

  sizeField.appendChild(sizeLabel);
  sizeField.appendChild(sizeSelect);

  sizeSelect.value = variation?.sizes_id || "";

  // Crear el segundo field (Stock)
  const stockField = document.createElement("div");
  stockField.classList.add("field");

  const stockLabel = document.createElement("label");
  stockLabel.textContent = "Stock";

  const stockInput = document.createElement("input");
  stockInput.type = "text";
  stockInput.name = "variation_stock";
  stockInput.placeholder = "";
  stockInput.required = true;
  stockInput.classList.add("numeric_only_input");
  stockInput.value = variation?.quantity || 0;

  stockField.appendChild(stockLabel);
  stockField.appendChild(stockInput);

  // Agregar elementos al contenedor principal
  container.appendChild(removeIcon);
  container.appendChild(sizeField);
  container.appendChild(stockField);
  return container;
}

export async function createDisableProductModal(product) {
  disableProductModal(product);
  handlePageModal(true);
  const form = document.querySelector(".ui.form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idToSend = product.id;
    // Hago el fetch para borrar
    let response = await fetch(`/api/product/${idToSend}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      response = await response.json();
      const productIndexFromList = productsFromDB?.findIndex(
        (dbProd) => dbProd.id == idToSend
      );
      if (productIndexFromList !== -1) {
        productsFromDB.splice(productIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updateProductTable();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
    return;
  });
}

export async function createDisableBrandModal(brand) {
  disableBrandModal(brand);
  handlePageModal(true);
  const form = document.querySelector(".ui.form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idToSend = brand.id;
    // Hago el fetch para borrar
    let response = await fetch(`/api/brand/${idToSend}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      response = await response.json();
      const brandIndexFromList = brandsFromDB?.findIndex(
        (dbBrand) => dbBrand.id == idToSend
      );
      if (brandIndexFromList !== -1) {
        brandsFromDB.splice(brandIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updateBrandTable();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
    return;
  });
}

export async function createDisableDropModal(drop) {
  disableDropModal(drop);
  handlePageModal(true);
  const form = document.querySelector(".ui.form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idToSend = drop.id;
    // Hago el fetch para borrar
    let response = await fetch(`/api/drop/${idToSend}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      response = await response.json();
      const dropIndexFromList = dropsFromDB?.findIndex(
        (dbDrop) => dbDrop.id == idToSend
      );
      if (dropIndexFromList !== -1) {
        dropsFromDB.splice(dropIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updateBrandTable();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
    return;
  });
}

export async function createDisableColorModal(color) {
  disableColorModal(color);
  handlePageModal(true);
  const form = document.querySelector(".ui.form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idToSend = color.id;
    // Hago el fetch para borrar
    let response = await fetch(`/api/color/${idToSend}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      response = await response.json();
      const colorIndexFromList = colorsFromDB?.findIndex(
        (dbColor) => dbColor.id == idToSend
      );
      if (colorIndexFromList !== -1) {
        colorsFromDB.splice(colorIndexFromList, 1);
      }
      closeModal();
      showCardMessage(true, response.msg);
      return updateColorTable();
    }
    let msg = "Ha ocurrido un error";
    showCardMessage(false, msg);
    return;
  });
}

function listenToProductModalBtns() {
  const addVariationBtn = document.querySelector(
    ".ui.modal .add-variation-btn"
  );
  const addVariationSizeBtns = document.querySelectorAll(
    ".ui.modal .add_size_button_field"
  );
  const removeVariationBtns = document.querySelectorAll(
    ".ui.modal .remove_variation_btn"
  );
  const removeVariationSizeBtns = document.querySelectorAll(
    ".ui.modal .remove-size-btn"
  );
  if (!addVariationBtn.dataset.listened) {
    addVariationBtn.dataset.listened = true;
    addVariationBtn.addEventListener("click", () => {
      const wrapper = document.querySelector(
        ".ui.modal .variations-wrapper-field"
      );
      const newField = generateVariationField();
      wrapper.appendChild(newField);
      //Agarro tanto el dropdown como el colorID para iniciarlo
      initiateColorDropdown(newField);
      return listenToProductModalBtns();
    });
  }
  addVariationSizeBtns.forEach((btn) => {
    if (btn.dataset.listened) return;
    btn.dataset.listened = true;
    btn.addEventListener("click", () => {
      const wrapper = btn
        .closest(".variation_field")
        .querySelector(".variation_sizes_wrapper");
      const tacoParentID = btn
        .closest(".variation_field")
        .querySelector('select[name="variation_colors_id"]').value;

      const newField = generateVariationSizeContainer({
        variation: undefined,
        tacoParentID,
      });
      wrapper.appendChild(newField);
      checkForNumericInputs();
      return listenToProductModalBtns();
    });
  });
  removeVariationBtns.forEach((btn) => {
    if (btn.dataset.listened) return;
    btn.dataset.listened = true;
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".variation_field");
      wrapper.remove();
    });
  });
  removeVariationSizeBtns.forEach((btn) => {
    if (btn.dataset.listened) return;
    btn.dataset.listened = true;
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".variation_size_container");
      wrapper.remove();
    });
  });
}

function listenProductModalCategorySelect() {
  const categorySelect = document.querySelector(
    '.ui.modal select[name="product_categories_id"]'
  );
  categorySelect.addEventListener("change", () => {
    const variationsWrapper = document.querySelector(
      ".ui.modal .variations-wrapper-field"
    );
    variationsWrapper.innerHTML = "";
  });
}

export function generateOrderDetailModal(order, isAdminModal = false) {
  destroyExistingModal();
  // Crear modal principal
  const modal = document.createElement("div");
  modal.classList.add("ui", "small", "modal");

  // Crear header
  const header = document.createElement("div");
  header.classList.add("header");
  const headerWording = "Detalle de la compra";
  header.innerHTML = `${headerWording} <i class="bx bx-x close-modal-btn"></i>`;

  // Crear contenido principal
  const content = document.createElement("div");
  content.classList.add("content", "order_detail_modal_content");

  // Crear tarjeta de orden
  const orderCard = document.createElement("div");
  orderCard.classList.add("ui", "card", "order_detail_card");

  // Contenido de la tarjeta
  orderCard.innerHTML = `
      <div class="content">
          <div class="modal_card_header_span">${getDateString(
            order.createdAt
          )}</div>
          <div class="modal_card_header_span border-left align-end">#${
            order.tra_id
          }</div>
      </div>`;
  if (isAdminModal) {
    orderCard.innerHTML +=
      '<div class="content product_table_list_content"></div>'; //Esto es para pitnar los orderItems
  } else {
    orderCard.innerHTML += `
        <div class="content">
        <div class="modal_card_content_row">
            <span class="modal-card_content-span">${
              order.orderItemsPurchased
            } producto${order.orderItemsPurchased > 1 ? "s":""}</span>
            <span class="modal-card_content-span">$${
              displayBigNumbers(order.orderItemsPurchasedPrice,2)
            }</span>
        </div>
        </div>`;
  }
  orderCard.innerHTML += `
      <div class="content">
          <span class="modal_card_content_row">
              <span class="modal-card_content-span bold">Total</span>
              <span class="modal-card_content-span bold">$${displayBigNumbers(order.total,2)}</span>
          </span>
      </div>
  `;
  let orderStatusSection = undefined;
  if (isAdminModal) {
    // Sección Detalle de Pago
    orderStatusSection = document.createElement("section");
    orderStatusSection.classList.add(
      "card_status-detail",
      "order_detail_card_section"
    );
    orderStatusSection.innerHTML = `
        <label class="card_label label">Estado de orden</label>
 <select class="ui select ${
   order.orderStatus.id == 6 ? "disabled" : ""
 }" id="orderStatusSelect">
            ${statusesFromDB
              .map(
                (status) => `
              <option value="${status.id}" ${
                  status.id === order.orderStatus.id ? "selected" : ""
                }>
                ${status.status}
              </option>
            `
              )
              .join("")}
              </select>
    `;
  }

  // Sección Detalle de Pago
  const paymentSection = document.createElement("section");
  paymentSection.classList.add(
    "card-payment-detail",
    "order_detail_card_section"
  );
  
  paymentSection.innerHTML = `
      <label class="card_label label">Detalle del pago</label>
      <div class="ui card">
          <div class="payment-logo-container card_logo_container">
              <img src="./img/logo/${order.paymentType?.filename}" alt="payment-logo">
          </div>
          <div class="payment-label_container card_label_container">
              <p class="payment-label card_label grey">${order.paymentType?.type}</p>
          </div>
      </div>
  `;

  // Sección Detalle de Envío
  const shippingSection = document.createElement("section");
  shippingSection.classList.add(
    "card_shipping_detail",
    "order_detail_card_section"
  );
  if (order.shippingType == 2) {
  }
  shippingSection.innerHTML = `
      <label class="card_label label">Detalle del envio</label>
      <div class="ui card">
          <div class="shipping-logo-container card_logo_container">
              <i class="${
                order.shippingType?.iconClass
              } card_logo_i" title = "${order.shippingType?.type}"></i>
          </div>
          <div class="card_label_container">
              <p class="card_label grey no-margin">${
                order.shippingType?.type
              }</p>
                
              <p class="card_desc grey no-margin">${
                order.shippingType.id == 1
                  ? order.shipping_address_street
                  : "A coordinar"
              }</p>
              <p class="card_desc grey no-margin">${
                order.shippingType.id == 1
                  ? order.shipping_address_detail || ""
                  : ""
              }</p>
               <p class="card_desc grey no-margin">${
                 order.shippingType.id == 1
                   ? `CP: ${order.shipping_address_zip_code}`
                   : ""
               }</p>
              <p class="card_desc grey no-margin">${
                order.shippingType.id == 1
                  ? `${order.shipping_address_city}, ${order.shipping_address_province}`
                  : ""
              }</p>
          </div>
      </div>
  `;

  // Sección Detalle de facturacion
  const billingSection = document.createElement("section");
  billingSection.classList.add(
    "card_billing_detail",
    "order_detail_card_section"
  );
  billingSection.innerHTML = `
      <label class="card_label label">Detalle de facturacion</label>
      <div class="ui card">
          <div class="card_label_container">
          <p class="card_label grey no-margin">Cliente</p>
              <p class="card_desc grey no-margin">${order.first_name} ${order.last_name}</p>
              <p class="card_desc grey no-margin">DNI: ${order.dni}</p>
              <p class="card_desc grey no-margin">Email: ${order.email}</p>
              <p class="card_desc grey">Telefono: +${order.phone_code}${order.phone_number}</p>
              <p class="card_label grey no-margin">Direccion</p>
              <p class="card_desc grey no-margin">${order.billing_address_street}</p>
              <p class="card_desc grey no-margin">${order.billing_address_detail}</p>
              <p class="card_desc grey no-margin">${order.billing_address_city}, ${order.billing_address_province}</p>
          </div>
      </div>
  `;
  // Ensamblar modal
  content.appendChild(orderCard);
  orderStatusSection && content.appendChild(orderStatusSection);
  content.appendChild(paymentSection);
  content.appendChild(shippingSection);
  content.appendChild(billingSection);
  modal.appendChild(header);
  modal.appendChild(content);
  modal.innerHTML += `<div class="ui dimmer">
    <div class="ui loader"></div>
  </div>`;
  // Agrego el closemodal even
  modal
    .querySelector(".close-modal-btn")
    ?.addEventListener("click", () => closeModal());

  return modal;
}

export function disableAddressModal(address) {
  destroyExistingModal();

  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Disable Address <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => closeModal());

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres borrar "${address.label}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => closeModal());

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);

  return modal;
}
export function disablePhoneModal(phone) {
  destroyExistingModal();

  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Disable Phone <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => closeModal());

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres borrar "${phone.phone_number}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => closeModal());

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);

  return modal;
}

export function disableProductModal(product) {
  destroyExistingModal();
  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Deshabilitar Producto <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => createProductModal(product));

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres deshabilitar "${product.name}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => createProductModal(product));

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);
  return modal;
}
export function disableBrandModal(brand = undefined) {
  destroyExistingModal();
  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Deshabilitar Marca <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => createBrandModal(brand));

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres deshabilitar "${brand.name}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => createBrandModal(brand));

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);
  return modal;
}

export function disableDropModal(drop = undefined) {
  destroyExistingModal();
  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Deshabilitar Drop <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => createDropModal(drop));

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres deshabilitar "${drop.name}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => createDropModal(drop));

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);
  return modal;
}

export function disableColorModal(color = undefined) {
  destroyExistingModal();
  // Crear el contenedor principal
  const modal = document.createElement("div");
  modal.className = "ui small modal";

  // Crear el header del modal
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `Deshabilitar Color <i class='bx bx-x close-modal-btn'></i>`;
  modal.appendChild(header);

  const closeModalBtn = modal.querySelector(".close-modal-btn");
  closeModalBtn.addEventListener("click", () => createBrandModal(color));

  // Crear el contenido del modal
  const content = document.createElement("div");
  content.className = "content";

  // Crear el formulario
  const form = document.createElement("form");
  form.className = "ui form destroy-form";

  // Crear el encabezado dentro del formulario
  const headerText = document.createElement("h4");
  headerText.className = "ui dividing header required";
  headerText.innerHTML = `¿Estas seguro que quieres deshabilitar "${color.name}"?`;
  form.appendChild(headerText);

  // Crear el contenedor de botones
  const buttonFields = document.createElement("div");
  buttonFields.className = "two fields";

  // Botón de cancelación
  const cancelField = document.createElement("div");
  cancelField.className = "field";
  const cancelButton = document.createElement("button");
  cancelButton.className = "ui basic grey button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";
  cancelField.appendChild(cancelButton);
  buttonFields.appendChild(cancelField);

  cancelButton.addEventListener("click", () => createBrandModal(color));

  // Botón de confirmación
  const confirmField = document.createElement("div");
  confirmField.className = "field";
  const confirmButton = document.createElement("button");
  confirmButton.className = "ui basic red button";
  confirmButton.textContent = "Confirmar";
  confirmButton.type = "submit";
  confirmField.appendChild(confirmButton);
  buttonFields.appendChild(confirmField);

  confirmButton.addEventListener("click", () =>
    confirmButton.classList.add("loading")
  );
  // Agregar los botones al formulario
  form.appendChild(buttonFields);

  // Agregar el formulario al contenido
  content.appendChild(form);

  // Agregar el contenido al modal
  modal.appendChild(content);

  // Agregar el modal al cuerpo del documento
  document.body.appendChild(modal);
  return modal;
}

export function generatePaymentButtonElement() {
  const paymentTypeID =
    document.querySelector('select[name="payment_types_id"]')?.value || null;
  const paymentType = paymentTypesFromDB.find(
    (type) => type.id == paymentTypeID
  );

  const button = document.createElement("button");
  button.className = `pay_button ui button finalize_order_button section_handler_button ${
    paymentTypeID == 1 ? `mercadopago_button` : `other_button`
  }`;

  // Usar logo grande si existe, sino el común
  const logoFilename = paymentType?.bigFilename || paymentType?.filename || "";
  const buttonText = paymentType?.checkoutButtonText || "Finalizar compra";

  button.innerHTML = `
    ${
      logoFilename
        ? `<img src="/img/logo/${logoFilename}" alt="${paymentType?.type}" />`
        : ""
    }
    <span>${buttonText}</span>
  `;

  return button;
}

export function generatePostOrderCard(traId, shippingTypeId, paymentTypeId) {
  // Crear el contenedor principal
  const card = document.createElement("div");
  card.classList.add("ui", "card", "post_order_card");

  // Crear elementos dentro de la tarjeta
  const header = document.createElement("h1");
  header.classList.add("card_header");
  header.textContent = "¡Gracias por tu compra!";

  const orderEmailInfo = document.createElement("p");
  orderEmailInfo.classList.add("order_status_p");
  orderEmailInfo.textContent =
    "Se te ha enviado un email con toda la informacion de la compra";

  const subHeader = document.createElement("p");
  subHeader.classList.add("card_sub_header");
  subHeader.textContent = "Tu número de orden es";

  const orderNumberContainer = document.createElement("div");
  orderNumberContainer.classList.add("order_number_container");

  const orderNumber = document.createElement("p");
  orderNumber.classList.add("card_order_number");
  orderNumber.textContent = `#${traId}`;

  const copyIcon = document.createElement("i");
  copyIcon.classList.add("bx", "bx-copy", "copy_order_number_btn");

  orderNumberContainer.appendChild(orderNumber);
  orderNumberContainer.appendChild(copyIcon);

  const orderStatus = document.createElement("p");
  orderStatus.classList.add("order_status_p");

  if (paymentTypeId == 1) {
    // Mercado Pago
    if (shippingTypeId == 1) {
      orderStatus.textContent =
        "Tu pedido ya está siendo preparado para ser despachado.";
    } else {
      orderStatus.textContent =
        "Tu pedido ya se encuentra disponible para ser recolectado.";
    }
  } else {
    // Transferencia o Efectivo
    orderStatus.textContent =
      "En el email encontrarás la información necesaria para realizar el pago.";
  }

  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("card_buttons_container");

  const homeButton = document.createElement("a");
  homeButton.href = "/";
  homeButton.classList.add("ui", "button", "green", "card_button", "small");
  homeButton.innerHTML =
    "<i class='bx bx-home-alt-2'></i><p class='button_text'>" +
    "Inicio" +
    "</p>";

  const purchasesButton = document.createElement("a");
  purchasesButton.href = "/perfil?index=3";
  purchasesButton.classList.add(
    "ui",
    "button",
    "green",
    "card_button",
    "small"
  );
  purchasesButton.innerHTML =
    "<i class='bx bx-spreadsheet'></i><p class='button_text'>" +
    "Mis compras" +
    "</p>";

  buttonsContainer.appendChild(homeButton);
  buttonsContainer.appendChild(purchasesButton);

  const logoContainer = document.createElement("div");
  logoContainer.classList.add("card_logo_container");

  const logo = document.createElement("img");
  logo.src = "/img/logo/branding/Variante_Verde/Logo_Icono.png";
  logo.alt = "card_logo";

  logoContainer.appendChild(logo);

  // Agregar elementos al contenedor principal
  card.appendChild(header);
  card.appendChild(orderEmailInfo);
  card.appendChild(subHeader);
  card.appendChild(orderNumberContainer);
  card.appendChild(orderStatus);
  card.appendChild(buttonsContainer);
  card.appendChild(logoContainer);

  return card;
}

export function generateTooltip(requirements) {
  // Crear el botón del tooltip
  const tooltipButton = document.createElement("div");
  tooltipButton.className = "ui icon button tooltip-icon";
  tooltipButton.dataset.position = "top left"; // Posición del tooltip

  // Crear el icono de información
  const tooltipIcon = document.createElement("i");
  tooltipIcon.className = "bx bx-info-circle";

  // Crear un div oculto para almacenar el contenido del tooltip
  const tooltipContent = document.createElement("div");
  tooltipContent.className = "ui popup tooltip-content";

  // Crear la lista dentro del tooltip
  const list = document.createElement("ul");
  list.className = "ui list";

  requirements.forEach((req) => {
    const listItem = document.createElement("li");
    listItem.textContent = req;
    list.appendChild(listItem);
  });

  tooltipContent.appendChild(list);

  // Agregar el icono y el contenido al botón
  tooltipButton.appendChild(tooltipIcon);
  tooltipButton.appendChild(tooltipContent);

  return tooltipButton;
}

export function generateUserVerifySection() {
  // Textos en ambos idiomas
  const texts = {
    title: "Por favor, verifica tu cuenta para poder continuar",
    desc: "¿Todavía no lo recibiste?",
    resend: "Reenviar código",
    verify: "Verificar",
  };

  // Crear el contenedor principal
  const verifySection = document.createElement("div");
  verifySection.className = "verify_section";

  // Crear el título
  const title = document.createElement("h1");
  title.className = "title";
  title.textContent = texts.title;

  // Crear la descripción y el botón de reenviar código
  const descContainer = document.createElement("div");
  descContainer.className = "desc_container";

  const descText = document.createElement("p");
  descText.textContent = texts.desc;

  const resendButton = document.createElement("a");
  resendButton.className = "ui button basic tiny resend-code";
  resendButton.textContent = texts.resend;

  descContainer.appendChild(descText);
  descContainer.appendChild(resendButton);

  // Crear la sección de inputs para el código de verificación
  const codeInputSection = document.createElement("section");
  codeInputSection.className = "code_input_section";

  for (let i = 0; i < 6; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "numeric_only_input verify-code-input";
    codeInputSection.appendChild(input);
  }

  // Crear el contenedor del botón de verificación
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button_container";

  const verifyButton = document.createElement("button");
  verifyButton.className = "ui button basic green verify_button disabled";
  verifyButton.textContent = texts.verify;

  buttonContainer.appendChild(verifyButton);

  // Agregar todos los elementos al contenedor principal
  verifySection.appendChild(title);
  verifySection.appendChild(descContainer);
  verifySection.appendChild(codeInputSection);
  verifySection.appendChild(buttonContainer);

  return verifySection;
}

export async function createProductModal(product = undefined) {
  if (!categoriesFromDB.length) await setCategories();
  createModal({
    headerTitle: product ? "Editar Product" : "Crear Producto",
    formClassName: "",
    formFields: [
      {
        type: "two-fields",
        fields: [
          {
            type: "toggle",
            name: "product_active",
            labelForToggle: "Activo",
            containerClassName: "margin_field",
            checked: product ? product?.active : false,
          },
          {
            type: "toggle",
            name: "product_is_dobleuso",
            labelForToggle: "DobleUso",
            containerClassName: "margin_field",
            checked: product ? product?.is_dobleuso : false,
          },
        ],
      },
      {
        type: "two-fields",
        fields: [
          {
            type: "text",
            label: "Nombre",
            name: "product_name",
            placeholder: "Zapato",
            required: true,
            containerClassName: "required",
            value: product ? product.name : "",
          },
          {
            type: "textarea",
            label: "Descripcion",
            name: "product_description",
            placeholder:
              "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Incidunt, ex.",
            required: true,
            containerClassName: "required",
            value: product ? product.description : "",
          },
        ],
      },
      {
        type: "two-fields",
        fields: [
          {
            type: "text",
            label: "USD Precio",
            name: "product_price",
            placeholder: "50",
            required: true,
            className: "float_only_input",
            containerClassName: "required",
            value: product ? product.price : "",
          },
          {
            type: "text",
            label: "Descuento",
            name: "product_discount",
            placeholder: "10",
            className: "numeric_only_input auto_select_input",
            value: product ? product.discount : "",
          },
        ],
      },
      {
        type: "two-fields",
        fields: [
          {
            type: "select",
            label: "Categoria",
            name: "product_categories_id",
            options: categoriesFromDB.map((cat) => ({
              value: cat.id,
              label: cat.name,
            })),
            required: true,
            containerClassName: "required",
            value: product ? product.categories_id : "",
          },
          {
            label: "Marca",
            name: "product_brands_id",
            type: "select",
            className:
              "ui search dropdown brand_search_input form_search_dropdown",
            containerClassName: "required",
            dataAttributes: {
              array_name: "brandsFromDB",
              entity_name: "Brand",
            },
            required: true,
          },
        ],
      },
      {
        type: "file",
        label: "Imagenes",
        name: "product_image",
        allowedExtensions: ["jpg", "jpeg", "png", "webp"],
        containerClassName: "input_file_container",
        multiple: true,
      },
      {
        type: "field",
        containerClassName: "margin_field files_thumb_field",
        extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
      },
      {
        type: "field",
        extraContent:
          '<button class="ui button small basic green add-variation-btn" type="button">Agregar Variacion</button>',
      },
      {
        type: "field",
        containerClassName: "margin_field variations-wrapper-field",
        extraContent: "", // Espacio donde se agregarán variaciones dinámicamente
      },
    ],
    buttons: [
      {
        type: "button",
        className: "ui button submit green send-modal-form-btn",
        text: product ? "Editar" : "Crear",
        onClick: async () => await handleProductModalActions(product),
      },
      {
        text: "Eliminar",
        className: `ui button right floated basic black submit black sign-up-btn ${
          !product ? "hidden" : ""
        }`,
        onClick: async () => createDisableProductModal(product),
      },
    ],
    id: product?.id || undefined,
  });
  // Una vez lo creo, lo abro
  handlePageModal(true);
  checkForFloatInputs();
  checkForNumericInputs();
  checkForAutoselectInputs();
  // Ahora cargo el select finder de la marca
  let object;
  if (!brandsFromDB?.length) {
    await setBrands();
  }
  object = {
    brandsFromDB,
  };
  checkForSelectFinders(object);
  if (!sizesFromDB.length) await setSizes();
  if (!colorsFromDB.length) await setColors();
  //Activo los togglers & Dropdown
  activateCheckboxTogglers();
  // Ahora voy por las variaciones
  // Agrupar por taco.id en un array de arrays
  if (product) {
    let groupsByColorId = Object.values(
      product.variations?.reduce((acc, item) => {
        const colorId = item.colors_id;
        if (!acc[colorId]) {
          acc[colorId] = [];
        }
        acc[colorId].push(item);
        return acc;
      }, {})
    );

    const colorVariationWrapper = document.querySelector(
      ".ui.modal .variations-wrapper-field"
    );

    // Lo dejo únicamente por colors_id, sizes_id y el stock
    groupsByColorId = groupsByColorId.map((group) =>
      group.map((item) => ({
        colors_id: item.colors_id,
        sizes_id: item.size.id,
        quantity: item.quantity,
      }))
    );

    groupsByColorId.forEach((colorVariations) => {
      const colorVariationElement = generateVariationField(colorVariations);
      colorVariationWrapper.appendChild(colorVariationElement);

      //Agarro tanto el dropdown como el colorID para iniciarlo
      const colorID = colorVariations[0].colors_id;
      initiateColorDropdown(colorVariationElement, colorID);

      checkForNumericInputs();
    });
    //Para elegir la marca
    const brandSearchDropdown = $(
      ".ui.modal .ui.dropdown.brand_search_input.search"
    );
    brandSearchDropdown.dropdown("set selected", [product.brands_id]).dropdown({
      fullTextSearch: "exact",
      showOnFocus: false,
      clearable: true,
    });
    // Tema imagenes
    let { files } = product;
    if (files && files.length)
      loadExistingImages(files, ".ui.modal .files_thumb_field");
  }
  listenProductModalCategorySelect();
  // Ahora agrego las escuchas
  listenToProductModalBtns();
  // Para escuchar los files
  listenToFileInput("product_image", (fileData) =>
    updateImages(fileData, ".ui.modal .files_thumb_field")
  );
}

export async function createBrandModal(brand = undefined) {
  try {
    createModal({
      headerTitle: brand ? "Editar Marca" : "Crear Marca",
      formClassName: "",
      formFields: [
        {
          type: "text",
          label: "Nombre",
          name: "brand_name",
          placeholder: "Adidas",
          required: true,
          containerClassName: "required",
          value: brand ? brand.name : "",
        },
        {
          type: "three-fields",
          fields: [
            {
              nestedFields: [
                {
                  type: "file",
                  label: "Logotipo",
                  name: "brand_logotype",
                  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
                  containerClassName: "input_file_container",
                  multiple: false,
                },
                {
                  type: "field",
                  containerClassName:
                    "margin_field files_thumb_field brand_field logotype_field",
                  extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
                },
              ],
            },
            {
              nestedFields: [
                {
                  type: "file",
                  label: "Logo unicamente",
                  name: "brand_logo",
                  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
                  containerClassName: "input_file_container",
                  multiple: false,
                },
                {
                  type: "field",
                  containerClassName:
                    "margin_field files_thumb_field brand_field logo_field",
                  extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
                },
              ],
            },
            {
              nestedFields: [
                {
                  type: "file",
                  label: "Isotipo (letras solo)",
                  name: "brand_isotype",
                  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
                  containerClassName: "input_file_container",
                  multiple: false,
                },
                {
                  type: "field",
                  containerClassName:
                    "margin_field files_thumb_field brand_field isotype_field",
                  extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
                },
              ],
            },
          ],
        },
      ],
      buttons: [
        {
          type: "button",
          className: "ui button submit green send-modal-form-btn",
          text: brand ? "Editar" : "Crear",
          onClick: async () => await handleBrandModalActions(brand),
        },
        {
          text: "Eliminar",
          className: `ui button right floated basic black submit black sign-up-btn ${
            !brand ? "hidden" : ""
          }`,
          onClick: async () => await createDisableBrandModal(brand),
        },
      ],
      id: brand?.id || undefined,
    });
    // Una vez lo creo, lo abro
    handlePageModal(true);
    if (brand) {
      const { logo, logotype, isotype } = brand;
      //Para pintar las imagenes
      let container, src;
      if (logo) {
        container = document.querySelector(".logo_field");
        src = logo.file_urls ? logo.file_urls[0].url : "";
        paintImgInContainer(container, src);
      }
      if (logotype) {
        container = document.querySelector(".logotype_field");
        src = logotype.file_urls ? logotype.file_urls[0].url : "";
        paintImgInContainer(container, src);
      }
      if (isotype) {
        container = document.querySelector(".isotype_field");
        src = isotype.file_urls ? isotype.file_urls[0].url : "";
        paintImgInContainer(container, src);
      }
    }
    // Para escuchar los files
    listenToBrandFileInputs();
  } catch (error) {
    console.log(error);
    return;
  }
}
export async function createDropModal(drop = undefined) {
  try {
    createModal({
      headerTitle: drop ? "Editar Drop" : "Crear Drop",
      formClassName: "",
      formFields: [
        {
          type: "two-fields",
          fields: [
            {
              type: "toggle",
              name: "drop_active",
              labelForToggle: "Activo",
              containerClassName: "margin_field",
              checked: drop ? drop?.active : false,
            },
            {
              type: "toggle",
              name: "drop_unique",
              labelForToggle: "Unico (hicimos produccion)",
              containerClassName: "margin_field",
              checked: drop ? drop?.unique : false,
            },
          ],
        },

        {
          type: "text",
          label: "Nombre",
          name: "drop_name",
          placeholder: "Drop 4 🏀",
          required: true,
          containerClassName: "required",
          value: drop ? drop.name : "",
        },
        {
          type: "select",
          label: "Productos",
          name: "drop_products",
          className:
            "ui search dropdown product_search_input form_search_dropdown",
          containerClassName: "required",
          placeholder: "Cargando...",
          dataAttributes: {
            array_name: "productsFromDB",
            entity_name: "Product",
          },
          required: true,
          multiple: true,
        },
        {
          type: "datetime-local",
          label: "Lanzamiento",
          name: "drop_launch_date",
          required: true,
          value: drop ? formatDateTimeForInput(drop.launch_date) : "",
        },
        {
          type: "file",
          label: "Imagenes para mostrar en web",
          name: "drop_card_images",
          allowedExtensions: ["jpg", "jpeg", "png", "webp"],
          containerClassName: "input_file_container",
          multiple: true,
        },
        {
          type: "field",
          containerClassName:
            "margin_field files_thumb_field drop_field card_images_field",
          extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
        },
        {
          type: "file",
          label: "Imagenes de fondo en listado de productos",
          name: "drop_bg_image",
          allowedExtensions: ["jpg", "jpeg", "png", "webp"],
          containerClassName: "input_file_container",
          multiple: false,
        },
        {
          type: "field",
          containerClassName:
            "margin_field files_thumb_field drop_field bg_image_field",
          extraContent: "", // Espacio donde se mostrarán las miniaturas de los archivos
        },
      ],
      buttons: [
        {
          type: "button",
          className: "ui button submit green send-modal-form-btn",
          text: drop ? "Editar" : "Crear",
          onClick: async () => await handleDropModalActions(drop),
        },
        {
          text: "Eliminar",
          className: `ui button right floated basic black submit black sign-up-btn ${
            !drop ? "hidden" : ""
          }`,
          onClick: async () => await createDisableDropModal(drop),
        },
      ],
      id: drop?.id || undefined,
    });
    // Una vez lo creo, lo abro
    handlePageModal(true);
    activateCheckboxTogglers();
    // Ahora cargo el select finder de la marca
    let object;
    if (!productsFromDB?.length) {
      await setProductsFromDB();
    }
    object = {
      productsFromDB,
    };
    checkForSelectFinders(object);
    if (drop) {
      const { bgImage, cardImages, products } = drop;
      const productsIDS = products?.map((prod) => prod.id) || [];
      //Para elegir los productos
      const productSearchDropdown = $(
        ".ui.modal .ui.dropdown.product_search_input.search"
      );
      productSearchDropdown.dropdown("set selected", productsIDS).dropdown({
        fullTextSearch: "exact",
        showOnFocus: false,
        clearable: true,
      });
      //Para pintar las imagenes
      let container, src;
      if (cardImages?.length) {
        //Cargo las imagenes
        loadExistingImages(
          cardImages,
          ".ui.modal .files_thumb_field.card_images_field"
        );
      }
      if (bgImage) {
        container = document.querySelector(
          ".ui.modal .files_thumb_field.bg_image_field"
        );
        src = bgImage.file_urls ? bgImage.file_urls[0].url : "";
        const filename = bgImage.filename;
        container.dataset.filename = filename;
        container.dataset.db_id = bgImage.id;
        container.classList.add("old_image_container");
        paintImgInContainer(container, src);
      }
    }
    // Para escuchar los files
    listenToFileInput("drop_card_images", (fileData) =>
      updateImages(fileData, ".ui.modal .card_images_field")
    );
    // Para escuchar los files
    listenToFileInput("drop_bg_image", (fileData) => {
      const { src, filename } = fileData[0];
      const container = document.querySelector(".ui.modal .bg_image_field");
      container.classList.remove("old_image_container");
      container.dataset.filename = filename;
      container.dataset.db_id = undefined;
      return paintImgInContainer(container, src);
    });
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function createColorModal(color = undefined) {
  try {
    createModal({
      headerTitle: color ? "Editar Color" : "Crear Color",
      formClassName: "",
      formFields: [
        {
          type: "text",
          label: "Nombre",
          name: "color_name",
          placeholder: "Azul",
          required: true,
          containerClassName: "required",
          value: color ? color.name : "",
        },
      ],
      buttons: [
        {
          type: "button",
          className: "ui button submit green send-modal-form-btn",
          text: color ? "Editar" : "Crear",
          onClick: async () => await handleColorModalActions(color),
        },
        {
          text: "Eliminar",
          className: `ui button right floated basic black submit black sign-up-btn ${
            !color ? "hidden" : ""
          }`,
          onClick: async () => await createDisableDropModal(color),
        },
      ],
      id: color?.id || undefined,
    });
    // Una vez lo creo, lo abro
    handlePageModal(true);
  } catch (error) {
    console.log(error);
    return;
  }
}

export function generateDashboardSettings(settings) {
  const container = document.createElement("div");
  container.classList.add("ui", "stacked", "cards", "setting_cards_wrapper");

  settings.forEach((setting) => {
    // Crear la card
    const card = document.createElement("div");
    card.classList.add("card");

    const content = document.createElement("div");
    content.classList.add("content");

    // Crear el encabezado
    const header = document.createElement("div");
    header.classList.add("header");
    header.textContent = setting.name;

    // Crear el contenedor del input y botón
    const actionInput = document.createElement("div");
    actionInput.classList.add("ui", "action", "input");

    // Crear el input
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("numeric_only_input");
    input.value = setting.value;

    // Crear el botón
    const button = document.createElement("button");
    button.classList.add("ui", "green", "button");
    button.textContent = "Guardar";

    // Agregar evento al botón para guardar el valor
    button.addEventListener("click", async () => {
      await saveSetting(setting.id, actionInput);
    });

    // Estructurar los elementos
    actionInput.appendChild(input);
    actionInput.appendChild(button);

    content.appendChild(header);
    content.appendChild(actionInput);
    card.appendChild(content);
    container.appendChild(card);
  });

  return container;
}

export function createBrandCard(brand) {
  // Crear el elemento <a> principal
  const card = document.createElement("a");
  card.classList.add("brand_card", "card_with_image", "section_wrapper_card"); //"animated_element"
  card.href = `/marcas/${brand.id}`; // Enlace vacío (puedes modificarlo si necesitas redirigir a otra página)

  // Contenedor de imágenes de productos
  const productWrapper = document.createElement("div");
  productWrapper.classList.add("brand_product_image_wrapper");

  // Overlay para el efecto visual
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");
  productWrapper.appendChild(overlay);

  // Obtener las imágenes principales de los productos con srcset
  const productsMainFile = brand.products
    .map((product) => product.files?.find((file) => file.main_file === 1))
    .filter(Boolean); // Filtrar valores nulos
  const productImages = productsMainFile.map(
    (productMainFile) => productMainFile?.file_urls
  );
  const productThumb = productsMainFile.map(
    (productMainFile) => productMainFile?.thumb_url
  );

  productWrapper.style.backgroundImage = `url(${productThumb[0]})`;

  // Agregar imágenes al contenedor con srcset
  productImages.forEach((fileUrls, index) => {
    if (!fileUrls || fileUrls.length === 0) return;

    const img = document.createElement("img");
    img.classList.add("brand_card_product_image", "card_image");

    // Construir el atributo srcset con las distintas versiones
    const srcset = fileUrls
      .map((file) => `${file.url} ${file.size}`)
      .join(", ");

    img.src =
      fileUrls.find((file) => file.size === "1x")?.url || fileUrls[0]?.url; // Fallback a 1x
    img.srcset = srcset;

    img.alt = `Producto de ${brand.name}`;
    img.loading = "lazy";
    // La primera imagen se activa por defecto
    if (index === 0) {
      if (img.complete) {
        img.classList.add("brand_card_product_image_active");
      }
      {
        img.addEventListener("load", () => {
          img.classList.add("brand_card_product_image_active");
        });
      }
    }

    productWrapper.appendChild(img);
  });

  // Agregar contenedor de imágenes al card
  card.appendChild(productWrapper);

  // Agregar el logo de la marca
  const brandLogo = document.createElement("img");
  brandLogo.src =
    brand.isotype?.file_urls?.find((f) => f.size === "2x")?.url || "";
  brandLogo.alt = brand.name;
  brandLogo.classList.add("brand_card_logo");

  card.appendChild(brandLogo);

  return card;
}

export function createDropCard(drop) {
  // Crear el elemento <a> de la tarjeta
  const dropCard = document.createElement("a");
  dropCard.classList.add(
    "drop_card",
    "card_with_image",
    "section_wrapper_card"
  ); //,"animated_element"
  dropCard.href = `/drop/${drop.id}`;

  // Crear el contenedor de imágenes
  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("drop_product_image_wrapper");

  // Agregar overlay
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");
  imageWrapper.appendChild(overlay);

  // Obtener imágenes de `cardImages`
  const images = drop.cardImages || [];
  images.forEach((image, index) => {
    if (!image.file_urls || image.file_urls.length === 0) return;

    const img = document.createElement("img");
    img.classList.add("card_image");
    img.alt = `Imagen de ${drop.name}`;
    img.loading = "lazy";
    // Construir el atributo srcset con diferentes tamaños
    img.srcset = image.file_urls
      .map((file) => `${file.url} ${file.size}`)
      .join(", ");

    // Usar la imagen de menor tamaño como fallback
    img.src =
      image.file_urls.find((file) => file.size === "1x")?.url ||
      image.file_urls[0]?.url;

    // Activar la segunda imagen por defecto
    // La primera imagen se activa por defecto
    if (index === 0) {
      if (img.complete) {
        img.classList.add("card_image_active");
      }
      {
        img.addEventListener("load", () => {
          img.classList.add("card_image_active");
        });
      }
    }

    imageWrapper.appendChild(img);
  });

  // Crear el contenedor de contenido
  const contentWrapper = document.createElement("div");
  contentWrapper.classList.add("drop_content");

  // Nombre del drop
  const dropName = document.createElement("h4");
  dropName.classList.add("drop_name");
  dropName.textContent = drop.name;
  contentWrapper.appendChild(dropName);

  // Fecha formateada
  const dropDate = document.createElement("p");
  dropDate.classList.add("drop_data", "drop_date");
  dropDate.textContent = getDateString(drop.launch_date);
  contentWrapper.appendChild(dropDate);

  // Cantidad de productos
  const dropProducts = document.createElement("p");
  dropProducts.classList.add("drop_data", "drop_products_length");
  dropProducts.textContent = `${drop.products?.length} producto${
    drop.products.length > 1 ? "s" : ""
  }`;
  contentWrapper.appendChild(dropProducts);

  let availableProducts =
    drop.products?.filter((prod) => prod.totalStock > 0)?.length || undefined;
  const pluralLetter = availableProducts > 1 ? "s" : "";
  const dropProductsAvailable = document.createElement("p");
  dropProductsAvailable.classList.add("drop_data", "drop_products_length");
  dropProductsAvailable.textContent =
    availableProducts > 2
      ? `${availableProducts} disponibles`
      : `Último${pluralLetter}${
          availableProducts > 1 ? ` ${availableProducts}` : ""
        } disponible${pluralLetter}`;
  availableProducts && contentWrapper.appendChild(dropProductsAvailable);

  // Agregar todos los elementos al dropCard
  dropCard.appendChild(imageWrapper);
  dropCard.appendChild(contentWrapper);

  return dropCard;
}
