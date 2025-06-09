import { userLogged } from "./checkForUserLogged.js";
import {
  checkoutCard,
  createCouponInputBox,
  form,
  generatePaymentButtonElement,
} from "./componentRenderer.js";
import {
  countriesFromDB,
  paymentTypesFromDB,
  setCountries,
  setPaymentTypes,
  setSettings,
  setShippingTypes,
  settingsFromDB,
  shippingTypesFromDB,
  appliedCoupon,
  setAppliedCoupon,
} from "./fetchEntitiesFromDB.js";
import { checkCartItemsToPaintQuantity } from "./header.js";
import {
  deleteLocalStorageItem,
  getLocalStorageItem,
  setLocalStorageItem,
} from "./localStorage.js";
import {
  applyCouponToDetail,
  displayBigNumbers,
  displayPriceNumber,
  emulateEvent,
  handleFormWarningDetail,
  handleNewAddressButtonClick,
  handleNewPhoneButtonClick,
  handleOrderInLocalStorage,
  isInDesktop,
  isOnPage,
  removeIndexesFromArray,
  scriptInitiator,
  //   setShippingZones,
  setVariationsFromDB,
  //   shippingZonesFromDB,
  showCardMessage,
  variationsFromDB,
} from "./utils.js";
let cartExportObj = {
  pageConstructor: null,
  paintCheckoutPhoneSelect: null,
  paintCheckoutAddressesSelect: null,
};
//seteo los productos
let cartProducts = [];

window.addEventListener("load", async () => {
  try {
    if (!isOnPage("/carro")) return;
    await scriptInitiator();
    const main = document.querySelector(".main");
    const cartProductsWrapper = document.querySelector(
      ".cart_products_cards_wrapper"
    );
    
    let shippingCost = 0; //Esto va cambiando por eso lo seteo aca
    let sectionIndex = 0; //Para ver donde esta parado
    cartExportObj.pageConstructor = async function () {
      try {
        await setCartProducts();
        //Agaro el titulo "carro de compras" y dependiendo que idioma lo pinto
        const pageTitle = document.querySelector(".main .cart_products_title");
        pageTitle.innerHTML = "Carro de compras";
        if (!settingsFromDB.length) await setSettings();
        if (sectionIndex == 1) {
          if (!countriesFromDB.length) await setCountries();
          if (!paymentTypesFromDB.length) await setPaymentTypes();
          //aca se que estoy en el formulario de pago
          await generateCheckoutForm();
          return;
        }
        //Aca solo pinto las cards
        paintCheckoutCards();
        setDetailContainer();
        //Ahora escucho los botones
        checkCheckoutCardButtons();
        // Actualizo el carro porlas de que se haya borrado el unico producto que tenia
        await updateUserCart(); 
        return;
      } catch (error) {
        return console.log(error);
      }
    };

    // =========================================
    // funciones
    //Pinta la seccion de detalle
    function setDetailContainer() {
      const containersToAppend = document.querySelectorAll(
        ".cart_detail_rail_container"
      );
      containersToAppend.forEach(async (cont, i) => {
        cont.innerHTML = "";
        //Lo genero
        let newDetailContainer = createCartDetailContainer();
        // Reemplazar el contenedor antiguo con el nuevo
        cont.appendChild(newDetailContainer);
        console.log(appliedCoupon);
        
        if(appliedCoupon) applyCouponToDetail(appliedCoupon)
      });
      checkForSectionButtons(); //Para los botones de "finalizar compra" o directo el de mp
    }
    //Pinta las tarjetas
    function paintCheckoutCards() {
      cartProductsWrapper.innerHTML = "";
      if (cartProducts?.length) {
        cartProducts.forEach((cartItem) => {
          if (cartItem.product) {
            //Esto es para que renderize bien
            cartItem.product.variations_id = cartItem.variations_id;
            cartItem.product.sizeFromDB = cartItem.size;
            cartItem.product.colorFromDB = cartItem.color;
            cartItem.product.quantity = cartItem.quantity;
            cartItem.product.maxQuantityAvailable =
              cartItem.maxQuantityAvailable;
            const checkoutCardElement = checkoutCard(cartItem.product);
            cartProductsWrapper.appendChild(checkoutCardElement);
          }
        });
        return;
      }
      //ACa no tiene proudctos, pinto algo
      cartProductsWrapper.className = "detail_list_container";
      cartProductsWrapper.innerHTML = `<p class="no-cart-p">No tienes productos en el carro</p>
      <p class="no-cart-p">
        Los productos que agregues se verán aquí
      </p>`;
      //Pinto disabled el boton de finalizar compra
      disableAllSectionButtons();
    }

    function checkForSectionButtons() {
      const sectionButtons = document.querySelectorAll(
        ".section_handler_button"
      );
      sectionButtons.forEach((btn) => {
        if (btn.dataset.listened) return;
        btn.dataset.listened = true;
        btn.addEventListener("click", async () => {
          window.scrollTo(0, 0);
          try {
            if (btn.classList.contains("finalize_order_button")) {
              if (sectionIndex == 0) {
                sectionIndex++;
                btn.classList.add("loading");
                // Actualizo el carro
                await updateUserCart();
                btn.classList.remove("loading");
                main.classList.add("active");
                cartExportObj.pageConstructor();
              } else if (sectionIndex == 1) {
                //Aca ya esta tocando para pagar ==> armo la orden y genero el fetch
                let form = document.querySelector(".checkout-form");
                handleFormWarningDetail(false);
                let formIsOK = checkCartFormIsComplete(form);
                if (!formIsOK) {
                  handleFormWarningDetail(true);
                  //Aca tengo que mostrarle al cliente que esta mal
                  return;
                }
                let body = generateCheckoutFormBodyToFetch(form);
                btn.classList.add("loading", "disabled");
                // Aca ya tengo todo ==> Hago el fetch
                const response = await fetch("/api/order", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(body),
                });
                if (response.ok) {
                  const preferenceResponse = await response.json();
                  handleOrderInLocalStorage({
                    type: 1,
                    orderID: preferenceResponse.orderTraID,
                  });
                  return (window.location.href = preferenceResponse.url);
                }
                //Aca dio error por alguna razon, doy refresh
                return window.location.reload();
              }
              return;
            }
            //ACa limipio el checkout section
            const checkoutSectionForm = document.querySelector(
              ".checkout_section .form_wrapper"
            );
            checkoutSectionForm.innerHTML = "";
            shippingCost = 0; //Reinicio el shippingCost
            sectionIndex = 0; //Reinicio el index
            setAppliedCoupon()
            cartExportObj.pageConstructor();
            return main.classList.remove("active");
          } catch (error) {
            console.log("Falle");
            return console.log(error);
          }
        });
      });
    }
    function checkCheckoutCardButtons() {
      const checkoutCards = document.querySelectorAll(".checkout-card");
      checkoutCards.forEach((card) => {
        if (card.dataset.listened) return;
        card.dataset.listened = true;
        const addBtn = card.querySelector(".add_more_product");
        const minusBtn = card.querySelector(".remove_more_product");
        const removeBtn = card.querySelector(".remove_card_btn");
        const cardPrice = card.querySelector(".card_price");
        let cardVariationID = card.dataset.variations_id;
        let cartProductFromDB = cartProducts.find(
          (cartItem) => cartItem.variations_id == cardVariationID
        );

        const productPrice = parseFloat(cartProductFromDB.product?.price);
        addBtn.addEventListener("click", () => {
          cartProductFromDB.quantity++;
          if (
            cartProductFromDB.quantity == cartProductFromDB.maxQuantityAvailable
          ) {
            addBtn.classList.add("disabled");
          }
        
          let actualQuantitySpan = card.querySelector(".card_product_amount");
          let newQuantity = parseInt(actualQuantitySpan.innerHTML) + 1;
          actualQuantitySpan.innerHTML = newQuantity;
        
          if (newQuantity > 1) {
            minusBtn.classList.remove("hidden");
            removeBtn.classList.add("hidden");
          }
        
          updateCardPrices(card, cartProductFromDB, newQuantity);
          modifyDetailList();
        });
        
        minusBtn.addEventListener("click", () => {
          cartProductFromDB.quantity--;
          addBtn.classList.remove("disabled");
        
          let actualQuantitySpan = card.querySelector(".card_product_amount");
          let newQuantity = parseInt(actualQuantitySpan.innerHTML) - 1;
          actualQuantitySpan.innerHTML = newQuantity;
        
          if (newQuantity == 1) {
            minusBtn.classList.add("hidden");
            removeBtn.classList.remove("hidden");
          }
        
          updateCardPrices(card, cartProductFromDB, newQuantity);
          modifyDetailList();
        });
        
        removeBtn.addEventListener("click", async () => {
          const cardLoader = card.querySelector(".ui.dimmer");
          cardLoader.classList.add("active");
          // Lo saco de la lista si es userLogged
          if (userLogged) {
            let itemID =
              cartProducts.find(
                (prod) => prod.variations_id == card.dataset.variations_id
              ).id || null;
            if (!itemID) return;
            let response = await fetch(`/api/cart/${itemID}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
              const msg =
                "Error inesperado, intente nuevamente en unos minutos";
              showCardMessage(false, msg);
            }
            //Aca ya lo borro, lo saco de los del cartproducts
            let indexToRemove = cartProducts?.findIndex(
              (item) => item.id == itemID
            );
            cartProducts = removeIndexesFromArray(cartProducts, [
              indexToRemove,
            ]);
          } else {
            updateGuestCart();
          }
          card.remove();
          modifyDetailList();

          // Aca si no tiene productos en el carro entonces deshabilito todos los botones
          if (!cartProducts.length) {
            //Pinto disabled el boton de finalizar compra
            disableAllSectionButtons();
          }
        });
      });
    }
    //escucha los + y - de los productos y en base a eso modifica el detalle
    function modifyDetailList() {
      let productLengthElement = document.querySelector(
        ".detail_row_product-length"
      );
      let totalCostElement = document.querySelector(".detail_row_total_cost");
      let productCostElement = document.querySelector(
        ".detail_row_product-cost"
      );
      let productCards = Array.from(
        document.querySelectorAll(".checkout-card")
      );
      let productLength = productCards?.length;
      let totalCost = parseFloat(shippingCost) || 0; //al principio es solo el shipping
      let productCost = 0;
      productCards.forEach((card) => {
        let cardVariationID = card.dataset.variations_id;
        let cartProductFromDB = cartProducts.find(
          (cartItem) => cartItem.variations_id == cardVariationID
        );
        const unityPrice = parseFloat(
          cartProductFromDB?.product?.discounted_price ||
            cartProductFromDB?.product?.price ||
            0
        );

        const totalUnits = parseInt(
          card.querySelector(".card_product_amount").innerText
        );
        let priceToAdd = parseFloat(unityPrice * totalUnits);

        productCost += priceToAdd;
        totalCost += priceToAdd;
      });

      productLengthElement.innerHTML = `${productLength} producto${
        productLength == 1 ? "" : "s"
      }`;
      productCostElement.innerHTML = `$${displayPriceNumber(productCost)}`;
      totalCostElement.innerHTML = `$${displayPriceNumber(totalCost)}`;
    }
    //Genera el formulario de pago
    async function generateCheckoutForm() {
      try {
        const formWrapper = document.querySelector(".form_wrapper");
        let shortInputWidth = isInDesktop() ? 40 : 100;
        // Primero pido los types que necesito si es que no estan
        if (!paymentTypesFromDB.length) {
          await setPaymentTypes();
        }
        if (!shippingTypesFromDB.length) {
          await setShippingTypes();
        }
        let shippingTypesForSelect = shippingTypesFromDB?.map((type) => ({
          value: type.id,
          label: type.type,
        }));
        let paymentTypesForSelect = paymentTypesFromDB?.map((type) => ({
          value: type.id,
          label:
            type.id != 2
              ? type.type
              : `${type.type} (unicamente retirando por CABA)`,
          disabled: type.id != 2 ? false : true,
        }));
        let userAddressesForDB = userLogged?.addresses?.map((address) => ({
          value: address.id,
          label: `${address.street} (${address.label})`,
        }));
        const props = {
          formTitleObject: {
            title: "Formulario de Pago",
          },
          formAction: "/api/order", // Cambiar a la ruta deseada
          method: "POST",
          inputProps: [
            {
              label: "Nombre",
              name: "first_name",
              placeholder: "Ingresa tu nombre",
              required: true,
              width: shortInputWidth,
              value: userLogged?.first_name || null,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "Apellido",
              name: "last_name",
              placeholder: "Ingresa tu apellido",
              required: true,
              width: shortInputWidth,
              value: userLogged?.last_name || null,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "Correo Electrónico",
              name: "email",
              type: "email",
              placeholder: "Ingresa tu correo electrónico",
              required: true,
              width: 100,
              value: userLogged?.email || null,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "DNI",
              name: "dni",
              placeholder: "Ingresa tu DNI",
              required: true,
              width: 100,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "Teléfono",
              name: "phone_id",
              type: "select",
              options: [],
              required: true,
              width: 100,
              contClassNames: "phone-container",
              inpClassNames: "",
            },
            {
              label: "Método de Pago",
              name: "payment_types_id",
              type: "select",
              options: paymentTypesForSelect,
              required: true,
              width: 100,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "Tipo de Envío",
              name: "shipping_types_id",
              type: "select",
              options: shippingTypesForSelect,
              required: true,
              width: 100,
              contClassNames: "",
              inpClassNames: "",
            },
            {
              label: "Usar mismas direcciones",
              name: "use-same-addresses",
              type: "switchCheckbox",
              value: 1,
              width: 100,
              contClassNames: "same-address-checkbox-container",
              inpClassNames: "",
            },
            {
              label: "Dirección de Facturación",
              name: "billing-address-id",
              type: "select",
              options: userAddressesForDB || [],
              required: true,
              width: 100,
              contClassNames: "billing-address-container",
              inpClassNames: "",
            },
            {
              label: "Dirección de Envío",
              name: "shipping-address-id",
              type: "select",
              options: userAddressesForDB || [],
              required: true,
              width: 100,
              contClassNames: "shipping-address-container",
              inpClassNames: "",
            },
          ],
          formClasses: "checkout-form",
        };
        // return
        const formToInsert = form(props);
        formWrapper.innerHTML = "";
        formWrapper.appendChild(formToInsert);
        //Activo lo de SemanticUI
        $(".ui.checkbox").checkbox();
        await addCheckoutFormDynamicButtons();
        cartExportObj.paintCheckoutPhoneSelect(); //Pinto los select del phone;
        cartExportObj.paintCheckoutAddressesSelect(); //Pinto los select de address
        listenToCheckoutFormTriggers(); //Esta funcion se fija las cosas que hace que shipping no aparezca
      } catch (error) {
        console.log(`Falle`);
        return console.log(error);
      }
    }
    //Agrega los botones de "add"
    async function addCheckoutFormDynamicButtons() {
      const shippingAddressFieldContainer = document.querySelector(
        ".shipping-address-container"
      );
      const billingAddressFieldContainer = document.querySelector(
        ".billing-address-container"
      );
      const phoneFieldContainer = document.querySelector(".phone-container");
      let buttonLabel = "Agregar";
      // Puede agregar si: esta loggeado y tiene menos de 4, si no esta loggeado
      const userCanAddPhone = userLogged ? userLogged.phones?.length < 4 : true;
      const userCanAddAddress = userLogged
        ? userLogged.addresses?.length < 4
        : true;

      // agrego los botones
      userCanAddPhone &&
        (await addButton(
          phoneFieldContainer,
          buttonLabel,
          "phone",
          handleNewPhoneButtonClick
        ));
      userCanAddAddress &&
        (await addButton(
          shippingAddressFieldContainer,
          buttonLabel,
          "address",
          handleNewAddressButtonClick
        ));
      userCanAddAddress &&
        (await addButton(
          billingAddressFieldContainer,
          buttonLabel,
          "address",
          handleNewAddressButtonClick
        ));
    }
    async function addButton(container, buttonText, entity, cb) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = buttonText;
      button.className = "add_new_field_btn";
      button.dataset.entity = entity;
      button.addEventListener("click", async () => await cb());
      // Buscar el input dentro del container para posicionar el botón antes
      const input = container.querySelector("input, select, textarea"); // Busca el input, select o textarea
      if (input) {
        container.insertBefore(button, input); // Inserta el botón antes del input
      } else {
        // Si no se encuentra input, lo añade al final como fallback
        container.appendChild(button);
      }
    }
    //Pinta el select de los telefonos & addresses
    cartExportObj.paintCheckoutPhoneSelect = async function () {
      if (!countriesFromDB?.length) await setCountries();
      //Aca agarro el select del carro y lo repinto con todos los telefonos
      const userPhoneSelect = document.querySelector(
        '.checkout_section select[name="phone_id"]'
      );
      // Limpiar las opciones actuales
      userPhoneSelect.innerHTML = "";
      let options = userLogged
        ? userLogged.phones
        : getLocalStorageItem("guestPhones") || [];
      //Primera opcion
      let firstOptionElement = document.createElement("option");
      firstOptionElement.value = "";
      firstOptionElement.textContent = "Elije un telefono";
      firstOptionElement.disabled = true;
      firstOptionElement.selected = options.length == 0 ? true : false;
      userPhoneSelect.appendChild(firstOptionElement);
      // Agregar las nuevas opciones
      options?.forEach((option, i) => {
        //Le pongo el pais
        let phoneCountry = option.country
          ? option.country
          : countriesFromDB?.find((count) => count.id == option.countries_id);
        const optionElement = document.createElement("option");
        optionElement.value = option.id || "";
        optionElement.textContent = `(+${phoneCountry?.code}) ${option?.phone_number} `;
        optionElement.selected =
          options.length == 1 ? true : option.default ? true : false;
        userPhoneSelect.appendChild(optionElement);
      });
      if (userLogged && options?.length >= 4) {
        //Aca es un usuario que ya agrego el maximo
        //Despinto los botones de add
        const addButtons = document.querySelectorAll(
          '.add_new_field_btn[data-entity="phone"]'
        );
        addButtons.forEach((btn) => btn.classList.add("hidden"));
      }
    };

    cartExportObj.paintCheckoutAddressesSelect = async function () {
      try {
        //Aca agarro el select del carro y lo repinto con todos las addresses
        const billingAddressSelect = document.querySelector(
          'select[name="billing-address-id"]'
        );
        const shippingAddressSelect = document.querySelector(
          'select[name="shipping-address-id"]'
        );
        let selectArray = [billingAddressSelect, shippingAddressSelect];
        selectArray.forEach((select) => {
          let valueSelected = select.value || null; //Si ya habia elegido lo dejo elegido por mas que pinte
          // Limpiar las opciones actuales
          select.innerHTML = "";
          let options = userLogged
            ? userLogged.addresses
            : getLocalStorageItem("guestAddresses") || [];
          //Primera opcion
          let firstOptionElement = document.createElement("option");
          firstOptionElement.value = "";
          firstOptionElement.textContent = "Elije una direccion";
          firstOptionElement.disabled = true;
          firstOptionElement.selected = options.length == 0 ? true : false;
          select.appendChild(firstOptionElement);
          // Agregar las nuevas opciones
          options?.forEach((option, i) => {
            //Le pongo el pais
            let optionAlreadySelected = option.id == valueSelected;
            const optionElement = document.createElement("option");
            optionElement.value = option.id || "";
            optionElement.textContent = `(${option?.label}) ${option?.street} | CP: ${option?.zip_code}`;
            //Basicamente si es el unico, si ya se habia seleccionado, o si es el default lo dejo seteado
            optionElement.selected =
              options.length == 1
                ? true
                : optionAlreadySelected
                ? true
                : option.default
                ? true
                : false;
            select.appendChild(optionElement);
          });
        });

        // Agrego la escucha para pintar el estimate cost
        if (!shippingAddressSelect.dataset.listened) {
          shippingAddressSelect.dataset.listened = true;
          shippingAddressSelect.addEventListener("change", async () => {
            // aca seteo el shipping cost
            setShippingCost();
            setDetailContainer();
            return;
          });
        }
        if (!billingAddressSelect.dataset.listened) {
          billingAddressSelect.dataset.listened = true;
          // Agrego la escucha para pintar el estimate cost (si es que useSameAddress es true)
          billingAddressSelect.addEventListener("change", async () => {
            const useSameAddressCheckbox = document.querySelector(
              '.checkout_section input[name="use-same-addresses"]'
            );
            if (useSameAddressCheckbox.checked) {
              // aca seteo el shipping cost
              setShippingCost();
              setDetailContainer();
            }

            return;
          });
        }

        // Emulo el cambio
        emulateEvent(shippingAddressSelect, "change");
        emulateEvent(billingAddressSelect, "change");
        if (userLogged && userLogged?.addresses.length >= 4) {
          //Aca es un usuario que ya agrego el maximo
          //Despinto los botones de add
          const addButtons = document.querySelectorAll(
            '.add_new_field_btn[data-entity="address"]'
          );
          addButtons.forEach((btn) => btn.classList.add("hidden"));
        }
      } catch (error) {
        return console.log(error);
      }
    };
    //Esta funcion se fija los triggers para esconder shippingAddress
    function listenToCheckoutFormTriggers() {
      const shippingTypeSelect = document.querySelector(
        '.checkout_section select[name="shipping_types_id"]'
      );
      const useSameAddressCheckbox = document.querySelector(
        '.checkout_section input[name="use-same-addresses"]'
      );
      const useSameAddressCheckboxContainer = document.querySelector(
        ".checkout_section .same-address-checkbox-container"
      );
      const shippingAddressField = document.querySelector(
        ".shipping-address-container"
      );
      const paymentTypeSelect = document.querySelector(
        '.checkout_section select[name="payment_types_id"]'
      );
      if (paymentTypeSelect && !paymentTypeSelect.dataset.listened) {
        paymentTypeSelect.dataset.listened = true;
        paymentTypeSelect.addEventListener("change", () => {
          replacePayButtons();
        });
      }
      if (!useSameAddressCheckbox.dataset.listened) {
        useSameAddressCheckbox.dataset.listened = true;
        useSameAddressCheckbox.addEventListener("change", (e) => {
          setShippingCost();
          setDetailContainer();
          if (e.target.checked) {
            modifyBillingLabel(false); //cambio el label
            shippingAddressField.querySelector("select").required = false;
            return shippingAddressField.classList.add("hidden");
          }
          modifyBillingLabel(true); // Cambio el label
          shippingAddressField.querySelector("select").required = true;
          return shippingAddressField.classList.remove("hidden");
        });
      }
      if (!shippingTypeSelect.dataset.listened) {
        shippingTypeSelect.dataset.listened = true;
        shippingTypeSelect.addEventListener("change", (e) => {
          try {
            modifyBillingLabel(true);

            if (e.target.value == 1) {
              // Envío a domicilio
              shippingAddressField.classList.remove("hidden");
              shippingAddressField.querySelector("select").required = true;
              setShippingCost();
              setDetailContainer();
              useSameAddressCheckboxContainer.classList.remove("hidden");
            } else {
              // Retiro por CABA
              shippingAddressField.classList.add("hidden");
              shippingAddressField.querySelector("select").required = false;
              useSameAddressCheckboxContainer.classList.add("hidden");
              useSameAddressCheckbox.checked = false;
              shippingCost = 0;
              shippingAddressField.querySelector("select").value = "";
              setDetailContainer();
            }

            // ⚠️ Siempre ejecutar esto, esté en domicilio o retiro
            const paymentTypeSelect = document.querySelector(
              '.checkout_section select[name="payment_types_id"]'
            );
            const cashOption =
              paymentTypeSelect?.querySelector('option[value="2"]');
            if (cashOption) {
              if (e.target.value == "2") {
                cashOption.disabled = false;
              } else {
                if (paymentTypeSelect.value == "2")
                  paymentTypeSelect.value = "1";
                cashOption.disabled = true;
              }
              replacePayButtons();
            }
          } catch (error) {
            console.log(error);
            return;
          }
        });
      }
    }
    //Crea la tarjeta de Detalle
    function createCartDetailContainer() {
      const productsLength = cartProducts?.length || 0;
      let productsCost = 0;
      cartProducts?.forEach((cartItem) => {
        const productPrice =
          cartItem.product?.discounted_price || cartItem.product?.price || 0;
        const itemQuantity = cartItem.quantity;
        productsCost += parseFloat(productPrice) * parseInt(itemQuantity);
      });
      const totalCost = displayPriceNumber(productsCost);

      // Crear contenedor principal
      const container = document.createElement("div");
      container.className = "cart_detail_container";

      // Crear título
      const title = document.createElement("h1");
      title.className = "cart_detail_title page_title";
      title.textContent = "Detalle";
      container.appendChild(title);

      // Crear contenedor de detalles
      const detailListContainer = document.createElement("div");
      detailListContainer.className = "detail_list_container";

      // Crear fila: Número de productos
      const productRow = document.createElement("div");
      productRow.className = "detail_list_row";

      const productLengthElement = document.createElement("p");
      productLengthElement.className = "detail_row_p detail_row_product-length";
      productLengthElement.textContent = `${productsLength} producto${
        productsLength > 1 ? "s" : ""
      }`;
      productRow.appendChild(productLengthElement);

      const productCost = document.createElement("p");
      productCost.className = "detail_row_p detail_row_product-cost";
      productCost.textContent = `$${displayPriceNumber(productsCost)}`;
      productRow.appendChild(productCost);

      detailListContainer.appendChild(productRow);

      // Crear fila: Envío
      const shippingRow = document.createElement("div");
      shippingRow.className = "detail_list_row";

      const shippingLabel = document.createElement("p");
      shippingLabel.className = "detail_row_p detail_row_shipping";
      shippingLabel.textContent = "Envío";
      shippingRow.appendChild(shippingLabel);

      const shippingTypeSelect = document.querySelector(
        'select[name="shipping_types_id"]'
      );
      const shippingAddressSelect = document.querySelector(
        'select[name="shipping-address-id"]'
      );
      const shippingCostContainer = document.createElement("p");
      shippingCostContainer.className = "detail_row_p";
      // Si es 0 y no hay address seleccionada
      if (shippingCost == 0 && !shippingAddressSelect?.value) {
        if (shippingTypeSelect && shippingTypeSelect.value == 2) {
          shippingCostContainer.innerHTML = `<span class="detail_row_shipping-cost">-</span>`;
        } else if (!shippingTypeSelect || !shippingAddressSelect?.value) {
          shippingCostContainer.innerHTML = `
            <span class="detail_row_shipping-cost">A estimar</span><br>
            <p class="shipping_note">Se coordina y cobra luego de la compra vía Andreani.</p>
          `;
        }
      } else {
        //Aca o bien no es 0, o bien hay address => Seteo el shipping cost y lo pinto
        setShippingCost();
        shippingCostContainer.innerHTML = `<span class="detail_row_shipping-cost">$${displayBigNumbers(
          shippingCost
        )} <p class="shipping_note">Precio estimado.</p></span><br>
            <p class="shipping_note">Se coordina y cobra luego de la compra vía Andreani.</p>`;
      }
      shippingRow.appendChild(shippingCostContainer);

      detailListContainer.appendChild(shippingRow);

      // Crear fila: Total
      const totalRow = document.createElement("div");
      totalRow.className = "detail_list_row last-row";

      const totalLabel = document.createElement("p");
      totalLabel.className = "detail_row_p detail_row_total";
      totalLabel.textContent = "Total";
      totalRow.appendChild(totalLabel);

      const totalCostElement = document.createElement("p");
      totalCostElement.className = "detail_row_p detail_row_total_cost";
      totalCostElement.textContent = `$${totalCost}`;
      totalRow.appendChild(totalCostElement);

      detailListContainer.appendChild(totalRow);

      // Agregar contenedor de detalles al principal
      container.appendChild(detailListContainer);

      // Crear botón de finalizar compra
      let finalizeButton, couponSection;

      if (sectionIndex === 0) {
        finalizeButton = document.createElement("button");
        finalizeButton.className =
          "ui button green finalize_order_button section_handler_button";
        finalizeButton.type = "button";
        if (cartProducts.length === 0) finalizeButton.classList.add("disabled");
        finalizeButton.textContent = "Finalizar compra";
      } else {
        couponSection = createCouponInputBox()
        finalizeButton = generatePaymentButtonElement();
      }
      couponSection ? container.appendChild(couponSection) : null;
      container.appendChild(finalizeButton);

      return container;
    }
    //Define los cart product dependiendo si esta loggeado o no
    async function setCartProducts() {
      cartProducts = userLogged
        ? userLogged.tempCartItems || []
        : getLocalStorageItem("cartItems") || []; //seteo el cartProduct
      const variationIdsToFetch = cartProducts?.map(
        (item) => item.variations_id
      ); //Dejo el array de ids para hacer fetch

      if (!variationIdsToFetch || !variationIdsToFetch.length) return;
      await setVariationsFromDB(variationIdsToFetch); //seteo los variations
      if (!variationsFromDB.length) return;
      let indexesToRemoveFromCart = [];
      cartProducts.forEach((cartItem, i) => {
        const variationFromDB = variationsFromDB?.find(
          (variation) => variation.id == cartItem.variations_id
        );
        //Aca lo dejo seteado con las entidades
        cartItem.product = variationFromDB?.product;
        cartItem.size = variationFromDB?.size;
        cartItem.color = variationFromDB?.color;
        cartItem.maxQuantityAvailable = variationFromDB?.quantity;
        //Si esta pidiendo mas le dejo el stock que tiene el producto
        if (cartItem.quantity > variationFromDB?.quantity) {
          if (variationFromDB.quantity == 0) {
            indexesToRemoveFromCart.push(i);
          }

          cartItem.quantity = variationFromDB?.quantity;
        }
      });
      //si hay productos sin stock los saco antes de pintarlos
      cartProducts = indexesToRemoveFromCart.length
        ? removeIndexesFromArray(cartProducts, indexesToRemoveFromCart)
        : cartProducts;

      return;
    }
    
    function setShippingCost() {
      const shippingTypeSelect = document.querySelector(
        'select[name="shipping_types_id"]'
      );
      const shippingPrice = settingsFromDB.find(
        (setting) => setting.setting_types_id == 2
      );
      if (shippingTypeSelect.value == 1) shippingCost = shippingPrice.value;
      else if (shippingTypeSelect.value == 2) shippingCost = 0;
    }

    function generateCheckoutFormBodyToFetch(form) {
      let bodyData = {
        users_id: userLogged ? userLogged.id : null,
        first_name: form["first_name"].value,
        last_name: form["last_name"].value,
        email: form["email"].value,
        dni: form["dni"].value,
        payment_types_id: form["payment_types_id"].value,
        shipping_types_id: form["shipping_types_id"].value,
        variations: [],
      };
      // Ahora voy por phone,shipping & billing, y variations
      // Se supone que aca ya tengo actualizado o bien cartItems o bien el userLogged, acceso a eso
      let cart = userLogged
        ? userLogged.tempCartItems
        : getLocalStorageItem("cartItems");
      cart = cart.map((tempCartItem) => ({
        id: tempCartItem.variations_id,
        quantityRequested: tempCartItem.quantity,
      }));
      bodyData.variations = cart;
      // Ahora el phone
      const phoneID = form["phone_id"].value;
      let phoneArrayToLook = userLogged
        ? userLogged.phones
        : getLocalStorageItem("guestPhones");
      let phoneObj = phoneArrayToLook?.find((dbPhone) => dbPhone.id == phoneID);
      phoneObj.id = userLogged ? phoneObj.id : null;
      bodyData.phoneObj = phoneObj;
      // Ahora las addresses
      let addressArrayToLook = userLogged
        ? userLogged.addresses
        : getLocalStorageItem("guestAddresses");
      const billingAddressId = form["billing-address-id"].value;
      let billingAddressObj = addressArrayToLook?.find(
        (dbAddress) => dbAddress.id == billingAddressId
      );
      billingAddressObj.id = userLogged ? billingAddressObj.id : null;
      bodyData.billingAddress = billingAddressObj;
      const useSameAddress = form["use-same-addresses"].checked;
      if (useSameAddress) {
        bodyData.shippingAddress = billingAddressObj; //Usa la misma
      } else {
        //Aca la busco
        const shippingAddressId = form["shipping-address-id"].value;
        let shippingAddressObj = addressArrayToLook?.find(
          (dbAddress) => dbAddress.id == shippingAddressId
        );
        shippingAddressObj
          ? (shippingAddressObj.id = userLogged ? shippingAddressObj?.id : null)
          : null;
        bodyData.shippingAddress = shippingAddressObj || null;
      }

      return bodyData;
    }
    function modifyBillingLabel(justBilling) {
      //ESto modifica la label del form
      const billingAddressLabel = document.querySelector(
        ".billing-address-container>label"
      );
      if (justBilling) {
        billingAddressLabel.textContent = "Dirección de Facturación";
        return;
      }
      billingAddressLabel.textContent = "Dirección de Facturación & Envío";
      return;
    }

    function checkCartFormIsComplete(form) {
      const requiredElements = form.querySelectorAll("[required]");
      let formIsOK = true;
      requiredElements.forEach((element) => {
        element.classList.remove("error_input");
        if (!element.value) {
          element.classList.add("error_input");
          formIsOK = false;
        }
        if (!element.dataset.listened) {
          element.dataset.listened = true;
          element.addEventListener("input", () => {
            element.classList.remove("error_input");
            if (!element.value) element.classList.add("error_input");
          });
        }
      });
      return formIsOK;
    }
    cartExportObj.pageConstructor();
    function replacePayButtons() {
      const oldButtons = document.querySelectorAll(".finalize_order_button");
      const newButton = generatePaymentButtonElement();
      oldButtons.forEach((oldButton) => {
        const clonedButton = newButton.cloneNode(true);
        oldButton.replaceWith(clonedButton);
      });
      checkForSectionButtons();
    }
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
});

export { cartExportObj };



function disableAllSectionButtons() {
  const sectionHandlerBtns = document.querySelectorAll(
    ".section_handler_button"
  );
  sectionHandlerBtns.forEach((btn) => btn.classList.add("disabled"));
}

async function updateUserCart() {
  try {
    let checkoutCards = Array.from(document.querySelectorAll(".checkout-card"));
    checkoutCards = checkoutCards.map((card) => {
      return {
        id: card.dataset?.variations_id,
        quantity: card.querySelector(".card_product_amount").innerText,
      };
    });
    if (userLogged) {
      //Aca tengo que actualizar el carro
      let response = await fetch(`/api/cart/${userLogged.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempCartItems: checkoutCards }),
      });
      if (!response.ok) {
        //Aca ver que hacer si da error TODO:
      }
      response = await response.json();
      userLogged.tempCartItems = response.updatedCardItems;
    } else {
      updateGuestCart();
    }
  } catch (error) {
    console.log("Falle");
    console.log(error);
    return;
  }
}

function updateGuestCart() {
  const checkoutCards = Array.from(
    document.querySelectorAll(".checkout-card")
  );
  // Aca borro y vuelvo a armar el local
  deleteLocalStorageItem("cartItems");
  checkoutCards.forEach((card) => {
    let cartProduct = cartProducts.find(
      (cartItem) => cartItem.variations_id == card.dataset.variations_id
    );
    if (!cartProduct) return;
    cartProduct.quantity = card.querySelector(
      ".card_product_amount"
    ).innerText;
    delete cartProduct.productFromDB;
    setLocalStorageItem("cartItems", cartProduct, true);
  });
}

function updateCardPrices(card, cartProductFromDB, quantity) {
  const priceWrapper = card.querySelector(".price_wrapper");

  const originalPriceEl = priceWrapper.querySelector(".original_price");
  const discountedPriceEl = priceWrapper.querySelector(".discounted_price");

  const unitPrice = parseFloat(cartProductFromDB.product?.price);
  const hasDiscount = cartProductFromDB.product?.discount > 0;
  const discountedUnitPrice = parseFloat(cartProductFromDB.product?.discounted_price);

  if (hasDiscount && discountedPriceEl) {
    originalPriceEl.innerHTML = `$${displayPriceNumber(quantity * unitPrice)}`;
    discountedPriceEl.innerHTML = `$${displayPriceNumber(quantity * discountedUnitPrice)}`;
  } else {
    originalPriceEl.innerHTML = `$${displayPriceNumber(quantity * unitPrice)}`;
  }
}
