import { checkForUserLogged, userLogged } from "./checkForUserLogged.js";
import {
  addressCard,
  checkoutCard,
  closeModal,
  createAddressModal,
  createBrandModal,
  createColorModal,
  createCouponModal,
  createDisableCouponModal,
  createDropModal,
  createLoadingSpinner,
  createProductModal,
  createUserMenuBtn,
  destroyExistingModal,
  form,
  generateOrderDetailModal,
  orderCard,
  phoneCard,
  renderAdminProductCard,
  renderAdminProductsToolbar,
  userInfoComponent,
} from "./componentRenderer.js";
import {
  gendersFromDB,
  setOrderStatuses,
  setGenders,
  statusesFromDB,
  brandsFromDB,
  setBrands,
  setDrops,
  dropsFromDB,
  colorsFromDB,
  setColors,
  settingsFromDB,
  setSettings,
  coupons,
  setCoupons,
} from "./fetchEntitiesFromDB.js";
import { paintUserIconOrLetter } from "./header.js";
import { generateDashboardSettings } from "./renderers/dashboardSettings.js";
import { renderProfilePlaceholder, renderUserAddressesPlaceholder, renderUserOrdersPlaceholder, renderUserPhonesPlaceholder } from "./renderers/placeholders.js";
import {
  handleNewAddressButtonClick,
  handleNewPhoneButtonClick,
  productsFromDB,
  sanitizeDate,
  setProductsFromDB,
  setOrdersFromDB,
  showCardMessage,
  ordersFromDB,
  handlePageModal,
  handleUpdateZonePrices,
  activateContainerLoader,
  fetchDBProducts,
  displayBigNumbers,
  minDecimalPlaces,
  scriptInitiator,
  isOnPage,
  isInDesktop,
  isInMobile,
  getDateString,
  handleFileInputChange,
  copyElementValue,
  activateCopyMsg,
  removeDoblecloverOverlay,
} from "./utils.js";

let activeIndexSelected = 0; //index del array "items"
let typeOfPanel; //Admin 1 | User 2
let userProfileExportObj = {
  pageConstructor: null,
};

window.addEventListener("load", async () => {
  if (!isOnPage("/perfil")) return;

  await scriptInitiator(); //Inicio userLogged
  if (!userLogged) return (window.location.href = "/");
  typeOfPanel = userLogged?.user_roles_id || 1;
  // Obtén el parámetro `index` de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const indexFromURL = urlParams.get("index");
  // esto es por si toca desde el dropdown
  if (indexFromURL !== null) {
    activeIndexSelected = parseInt(indexFromURL, 10); //El 10 es por algo tecnico del parseInt
  }
  // Ocultar overlay
  removeDoblecloverOverlay();
  // Ahora, depende quien sea y donde este pinto el placeholder correspondiente
  setUserProfilePlaceholder();
  // return;
  await setOrderStatuses();
  
 
  // Si existe el parámetro, actualiza `activeIndexSelected`

  let userOrders = [];
  // return
  await setGenders(); //Setea el genero
  const main = document.querySelector(".main");
  const mainContentWrapper = document.querySelector(".main_content_wrapper");
  // Para los labels
  //Esta funcion chequea el click de lo que se toque en menu
  function handleUserMenuSection() {
    const anchorItemsFromMenu = Array.from(
      document.querySelectorAll(".main .user_menu_btn .item")
    );
    const menuBtn = document.querySelector(".main .user_menu_btn>i");
    for (const anchor of anchorItemsFromMenu) {
      if (anchor.dataset.listened) return;
      anchor.dataset.listened = true;

      anchor.addEventListener("click", async () => {
        if (!isInMobile()) {
          //Tablet o desktop
          anchorItemsFromMenu.forEach((item) => (item.className = "item"));
          anchor.className = "item active selected";
        }
        let iconClass = anchor.querySelector("i")?.className;
        menuBtn.className = iconClass;
        const anchorIndex = anchor.dataset.index;
        if (activeIndexSelected != anchorIndex) {
          // Aca esta tocando otro
          activeIndexSelected = parseInt(anchor.dataset.index);
          await contentConstructorHandler();
        }
      });
    }
  }

  userProfileExportObj.pageConstructor = async function () {
    const placeholders = document.querySelectorAll(".placeholder");
    placeholders?.forEach((element) => element.remove());
    mainContentWrapper.classList.remove("hidden");
    menuBtnConstructor(); //Pinto las opciones
    await contentConstructorHandler();
  };

  userProfileExportObj.pageConstructor();

  //Esta funcion define que pintar (dependiendo que esta seleccionado, y si es admin/user)
  async function contentConstructorHandler() {
    try {
      //Despinto el wrapper
      mainContentWrapper.innerHTML = "";

      //esta funcion dependiendo que viene invoca a la funcion que pinta/despinta las cosas
      switch (activeIndexSelected) {
        case 0: //Profile | Ventas
          typeOfPanel === 2 ? paintUserProfile() : await paintAdminSales();
          break;
        case 1: //Addresses | Products
          typeOfPanel === 2 ? paintUserAddresses() : await paintAdminProducts();
          break;
        case 2: //Phones | marcas & drops
          typeOfPanel === 2
            ? paintUserPhones()
            : await paintAdminBrandsAndDrops();
          break;
        case 3: //Order History | coupons
          typeOfPanel === 2
            ? await paintUserOrders()
            : await paintAdminCoupons();
          break;
        case 4: //Order History | settings
          typeOfPanel === 2 ? null : await paintAdminSettings();
          break;
        default:
          break;
      }
    } catch (error) {
      console.log("Falle");
      return console.log(error);
    }
  }
  //Construye el menu
  function menuBtnConstructor() {
    const userProps = {
      type: typeOfPanel, // User panel
      items: [
        {
          itemType: "profile", // Identificador
          itemLogo: "bx bx-user-circle", // Clase CSS para el ícono
          itemLabel: "Perfil", // Texto del tooltip
        },
        {
          itemType: "address",
          itemLogo: "bx bx-map",
          itemLabel: "Mis Direcciones",
        },
        {
          itemType: "phones",
          itemLogo: "bx bx-phone",
          itemLabel: "Mis Telefonos",
        },
        {
          itemType: "orderHistory",
          itemLogo: "bx bx-spreadsheet",
          itemLabel: "Historial de Compras",
        },
      ],
      actualIndexSelected: activeIndexSelected, //Esto basicamente es para saber cual item renderizar activo
    };
    //Para los labels
    const adminProps = {
      type: typeOfPanel, //Admin panel
      items: [
        {
          itemType: "sales", // Identificador
          itemLogo: "bx bx-money-withdraw", // Clase CSS para el ícono
          itemLabel: "Ventas", // Texto del tooltip
        },
        {
          itemType: "products", // Identificador
          itemLogo: "bx bxs-tag", // Clase CSS para el ícono
          itemLabel: "Productos", // Texto del tooltip
        },
        {
          itemType: "shipping", // Identificador
          itemLogo: "bx bx-table", // Clase CSS para el ícono
          itemLabel: "Marcas, Drops & Colores", // Texto del tooltip
        },
        {
          itemType: "coupons", // Identificador
          itemLogo: "bx bx-purchase-tag-alt", // Clase CSS para el ícono
          itemLabel: "Cupones", // Texto del tooltip
        },
        {
          itemType: "settings", // Identificador
          itemLogo: "bx bxs-cog", // Clase CSS para el ícono
          itemLabel: "Ajustes", // Texto del tooltip
        },
      ],
      actualIndexSelected: activeIndexSelected, //Esto basicamente es para saber cual item renderizar activo
    };
    const checkedProps = typeOfPanel === 2 ? userProps : adminProps;
    const previousMenuBtn = main.querySelector(".dropdown.user_menu_btn");
    if (previousMenuBtn) previousMenuBtn.remove(); //Lo borro
    const menuBtn = createUserMenuBtn(checkedProps);
    // Insertar el botón antes de mainContentWrapper
    main.insertBefore(menuBtn, mainContentWrapper);
    handleUserMenuSection();
    if (isInMobile()) {
      // ACtivo el dropdown
      $(".ui.dropdown.user_menu_btn").dropdown({
        direction: "upward",
        keepOnScreen: true,
        context: window,
      });
    }
  }
  //FUNCINONES PARA PINTAR EL HTML DEL USER PANEL
  function paintUserProfile() {
    const { userInfoComponentElement, userForm } = createUserProfileComponent();

    mainContentWrapper.className = "main_content_wrapper user_info_wrapper";
    mainContentWrapper.appendChild(userInfoComponentElement);
    mainContentWrapper.appendChild(userForm);
  }

  function paintUserAddresses() {
    let addressesToPaint = userLogged?.addresses;
    //le seteo las clases
    mainContentWrapper.className = "main_content_wrapper address_wrapper";
    if (userLogged?.addresses.length < 4) {
      //Agrego la tarjeta para agregar
      const emptyAddressCard = addressCard(undefined);
      mainContentWrapper.appendChild(emptyAddressCard);
      // Agregar el evento al hacer clic
      emptyAddressCard.addEventListener("click", () =>
        handleNewAddressButtonClick()
      );
    }

    for (const address of addressesToPaint) {
      // Crear y agregar la tarjeta de dirección
      const addressElement = addressCard(address);
      mainContentWrapper.appendChild(addressElement);
    }
  }
  function paintUserPhones() {
    let phonesToPaint = userLogged?.phones;
    //le seteo las clases
    mainContentWrapper.className = "main_content_wrapper phones_wrapper";
    if (phonesToPaint.length < 3) {
      //Agrego la tarjeta para agregar
      const emptyPhoneCard = phoneCard(undefined);
      mainContentWrapper.appendChild(emptyPhoneCard);
      // Agregar el evento al hacer clic
      emptyPhoneCard.addEventListener("click", () =>
        handleNewPhoneButtonClick()
      );
    }
    for (const address of phonesToPaint) {
      // Crear y agregar la tarjeta de dirección
      const phoneElement = phoneCard(address);
      mainContentWrapper.appendChild(phoneElement);
    }
  }
  async function paintUserOrders() {
    try {
      //le seteo las clases
      mainContentWrapper.className = "main_content_wrapper user_orders_wrapper";
      //Recien aca cargo las ordenes
      if (!userOrders.length) userOrders = await getUserOrders();
      userOrders.forEach((order) => {
        const orderCardElement = orderCard(order);
        orderCardElement.addEventListener("click", () => {
          let orderModalElement = generateOrderDetailModal(order);
          document.body.appendChild(orderModalElement);
          handlePageModal(true);
        });
        mainContentWrapper.appendChild(orderCardElement);
      });
    } catch (error) {
      console.log(error);
      return;
    }
  }
  function createUserProfileComponent() {
    const userInfoComponentElement = userInfoComponent(userLogged);

    // 🔹 Crear botón de cambio de contraseña
    const changePassBtn = document.createElement("button");
    changePassBtn.textContent = "Cambiar contraseña";
    changePassBtn.className = "change_password_btn ui button";

    // Insertar el botón debajo del email o al final del form
    userInfoComponentElement.appendChild(changePassBtn);

    // 🔹 Agregar evento
    changePassBtn.addEventListener("click", async () => {
      try {
        changePassBtn.classList.add("loading", "disabled");
        const res = await fetch("/api/user/generate-password-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userLogged.id }), // Enviar ID del usuario
        });

        const data = await res.json();
        changePassBtn.classList.remove("loading", "disabled");
        if (!res.ok) throw new Error(data.msg || "Error al solicitar enlace");

        showCardMessage(
          true,
          "Enlace enviado a tu correo para cambiar la contraseña."
        );
      } catch (err) {
        console.error(err);
        showCardMessage(false, "Hubo un problema al generar el enlace.");
      }
    });

    let genderOptions = gendersFromDB.map((gender) => ({
      value: gender.id,
      label: gender.name,
      selected: gender.id == userLogged.genders_id,
    }));
    const userFormProps = {
      formAction: "/api/user", // Acción del formulario
      method: "PUT", // Método del formulario
      formClasses: "user-info-form",
      inputProps: [
        {
          type: "text",
          name: "first_name",
          placeholder: "Nombre",
          label: "Nombre",
          required: true,
          value: userLogged.first_name || "",
          width: 45, // El ancho del campo en porcentaje
          contClassNames: "first-name-container", // Clases adicionales para el contenedor
        },
        {
          type: "text",
          name: "last_name",
          placeholder: "Apellido",
          label: "Apellido",
          required: true,
          width: 45,
          value: userLogged.last_name || "",
          contClassNames: "last-name-container",
        },
        {
          type: "select",
          name: "genders_id",
          label: "Genero",
          required: true,
          options: genderOptions,
          width: 100,
          contClassNames: "gender_container",
        },
      ],
      buttonProps: [
        {
          type: "button",
          className: "green send_form_btn",
          text: "Actualizar",
          onClick: async () => await handleUserUpdateFetch(),
        },
      ],
    };
    const userForm = form(userFormProps);
    return { userInfoComponentElement, userForm };
  }
  async function handleUserUpdateFetch() {
    const bodyData = {};
    const form = document.querySelector(".form_container .user-info-form");
    const sendButton = form.querySelector(".send_form_btn");
    bodyData.first_name = form.first_name?.value;
    bodyData.last_name = form.last_name?.value;
    bodyData.genders_id = form.genders_id?.value;
    sendButton.classList.add("loading");
    let response = await fetch(`/api/user/${userLogged.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    sendButton.classList.remove("loading");
    if (response.ok) {
      response = response.ok ? await response.json() : null;
      //Esta es la respuesta de las credenciales
      //Aca dio ok, entonces al ser de un usuario actualizo al usuarioLogged.phones
      userLogged.first_name = bodyData.first_name;
      userLogged.last_name = bodyData.last_name;
      userLogged.genders_id = bodyData.genders_id;
      showCardMessage(true, response.msg);
      mainContentWrapper.innerHTML = "";
      paintUserProfile();
      paintUserIconOrLetter(); //Esto es para que cambie las inciiales
      return;
    }
    let msg = "Ha ocuriddo un error inesperado, intente nuevamente";
    showCardMessage(false, msg);
    return;
  }
});

const orderLimit = 8;
let offset = 0;

const paintAdminSales = async () => {
  if (!ordersFromDB.length) await setOrdersFromDB();
  const mainWrapper = document.querySelector(".main_content_wrapper");
  const tableContainer = document.createElement("div");
  tableContainer.classList.add("table_container");
  const gridTable = document.createElement("div");
  gridTable.className = "ag-theme-alpine";
  gridTable.id = "myGrid";
  tableContainer.appendChild(gridTable);
  mainWrapper.appendChild(tableContainer);
  const rowsData = [];
  ordersFromDB.forEach((order) => {
    const rowObject = {
      identificador: order.tra_id,
      nombre: order.first_name,
      apellido: order.last_name,
      items: order.orderItems.length,
      fecha: sanitizeDate(order.createdAt),
      estado: order.orderStatus.status,
      "Tipo de envío": order.shippingType.type,
    };
    rowsData.push(rowObject);
  });
  const gridData = {
    columnDefs: [
      { field: "identificador", flex: 0.8 },
      { field: "nombre", flex: 0.8 },
      { field: "apellido", flex: 1 },
      { field: "items", flex: 0.5, filter: "agNumberColumnFilter" },
      { field: "estado", flex: 1 },
      { field: "Tipo de envío", flex: 0.6 },
      { field: "fecha", flex: 0.6 },
    ],
    domLayout: "autoHeight",
    onRowClicked: (event) => {
      const order = ordersFromDB.find(
        (order) => order.tra_id === event.data.identificador
      );
      handleOrderRowClick(order);
    },
  };
  gridData.rowData = rowsData;
  const gridDiv = document.querySelector("#myGrid");
  agGrid.createGrid(gridDiv, gridData);
};

const filterOrdersByDateRange = (orders, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end;
  });
};

const paintAdminProducts = async () => {
  if (!productsFromDB.length) await setProductsFromDB();

  const mainWrapper = document.querySelector(".main_content_wrapper");
  mainWrapper.innerHTML = ""; // Limpiamos antes de pintar

  // Insertamos toolbar
  const toolbar = renderAdminProductsToolbar();
  mainWrapper.appendChild(toolbar);

  // Contenedor de tarjetas (vacío al inicio)
  const cardsWrapper = document.createElement("div");
  cardsWrapper.className = "products_cards_wrapper";
  mainWrapper.appendChild(cardsWrapper);

  // Pintar tarjetas iniciales con orden/filtro actual
  renderFilteredSortedCards();
  updateFilterOptionCounts();
  // Escuchar botón + selects
  listenToAdminProductToolbar();
};

const handleProductRowClick = async (product) => {
  await createProductModal(product);
};

const handleOrderRowClick = async (order) => {
  destroyExistingModal();
  const orderModalElement = generateOrderDetailModal(order, true);
  document.body.appendChild(orderModalElement);
  handlePageModal(true);
  addOrderStatusSelectEventListener(order);
  // Ahora busco los orderItems y sus fotos
  let idsToFetch = order.orderItems?.map((item) => item.variation?.products_id);

  let productsAlreadyFetched = productsFromDB?.map((prod) => prod.id);
  let productsAlreadyFetchedSet = new Set(productsAlreadyFetched);
  idsToFetch = idsToFetch.filter((id) => !productsAlreadyFetchedSet.has(id));
  const modal = document.querySelector(".ui.modal");
  // Esto es para pintar las imagenes de los productos
  if (idsToFetch.length) {
    activateContainerLoader(modal, true);
    //aca tengo que buscar esos productos
    const fetchedProductsFromDB = await fetchDBProducts({ id: idsToFetch });
    activateContainerLoader(modal, false);
    //Los agrego al array de productos
    fetchedProductsFromDB.forEach((prod) => productsFromDB.push(prod));
  }
  //Aca ya lo tengo en productsFromDB ==> Lo busco por el id de cada item y lo seteo
  // Crear un Map para acceso rápido por ID
  const productsMap = new Map(productsFromDB.map((prod) => [prod.id, prod]));

  // Asignar el producto a cada orderItem y pintar en el wrapper de la lista
  const orderItemsListInTable = modal.querySelector(
    ".content.product_table_list_content"
  );
  //Ahora pinto en la tabla de products
  order.orderItems.forEach((orderItem) => {
    orderItem.product =
      productsMap.get(orderItem.variation?.products_id) || null;

    // Obtener imagen del producto o imagen default
    let productImage = "./img/product/default.png";
    let srcset = "";
    if (orderItem.product?.files?.length) {
      const firstFile = orderItem.product.files[0];
      productImage =
        firstFile.file_urls.find((urlObj) => urlObj.size == "1x")?.url ||
        firstFile.file_urls[0].url;
      srcset = firstFile.file_urls
        .map((urlObj) => `${urlObj.url} ${urlObj.size}`)
        .join(", ");
    }

    // Cálculos de precios y descuentos
    const quantity = orderItem.quantity;
    const finalUnitPrice = orderItem.price;
    const productDiscount = orderItem.product_discount || 0;
    const couponDiscount = orderItem.coupon_discount || 0;

    const priceBase =
      finalUnitPrice /
      ((1 - productDiscount / 100) * (1 - couponDiscount / 100));
    const totalBase = priceBase * quantity;
    const totalFinal = finalUnitPrice * quantity;

    const showOriginalPrice = productDiscount > 0 || couponDiscount > 0;

    const discountNote =
      couponDiscount > 0
        ? `<span class="coupon-note grey">Con cupón aplicado (${couponDiscount}%)</span>`
        : "";

    // Crear HTML de la fila
    const orderItemRow = `
      <div class="modal_card_content_row order_item_row">
        <!-- Columna Imagen -->
        <div class="order_item_image">
          <img src="${productImage}" srcset="${srcset}" alt="${
      orderItem.name
    }" class="product_image">
        </div>
  
        <!-- Columna Descripción -->
        <div class="order_item_description">
          <span class="product-name">${orderItem.name}</span>
          <span class="product-details grey">${orderItem.color} - ${
      orderItem.size
    }</span>
          <span class="product-quantity grey">Cantidad: ${
            orderItem.quantity
          }</span>
        </div>
  
        <!-- Columna Precio -->
        <div class="order_item_price">
          ${
            showOriginalPrice
              ? `<span class="original-price grey">$${displayBigNumbers(
                  totalBase
                )}</span>`
              : ""
          }
          <span class="total-price bold">$${displayBigNumbers(
            totalFinal
          )}</span>
          ${discountNote}
        </div>
      </div>
    `;

    orderItemsListInTable.innerHTML += orderItemRow;
  });
};

const handleChangeOrderStatusWrapper = async (e, order) => {
  await handleChangeOrderStatus(e, order);
};

const addOrderStatusSelectEventListener = (order) => {
  const select = document.getElementById("orderStatusSelect");

  // declaramos una propiedad del select como funcion
  select._handleChangeOrderStatusWrapper = (e) =>
    handleChangeOrderStatusWrapper(e, order);

  // al hacer el event listener, el callback es el wrapper
  select.addEventListener("change", select._handleChangeOrderStatusWrapper);
};

const handleChangeOrderStatus = async (e, order) => {
  const modal = document.querySelector(".ui.modal");
  try {
    const newOrderStatus = e.target.value;
    activateContainerLoader(modal, true);
    let statusResponse = await fetch(`/api/order/order-status/${order.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_statuses_id: newOrderStatus }),
    });
    activateContainerLoader(modal, false);

    if (statusResponse.ok) {
      const orderIndexToModify = ordersFromDB.findIndex(
        (ord) => ord.id == order.id
      );
      const newOrderStatusObj = statusesFromDB.find(
        (status) => status.id == newOrderStatus
      );
      ordersFromDB[orderIndexToModify].orderStatus = newOrderStatusObj;
      ordersFromDB[orderIndexToModify].order_statuses_id = newOrderStatus;

      return userProfileExportObj.pageConstructor();
    }
    //Aca fallo, cierro el modal y mando mensaje
    statusResponse = await statusResponse.json();
    closeModal();
    showCardMessage(false, statusResponse.msg);
    return;
  } catch (error) {
    return console.log(error);
  }
  activateContainerLoader(modal, false);
};

const getAllOrders = async () => {
  const response = await fetch(
    `/api/order?limit=${orderLimit}&offset=${offset}`
  );
  const data = await response.json();
  return data.orders;
};

async function getUserOrders() {
  let array =
    (
      await (
        await fetch(
          `${window.location.origin}/api/user/order?users_id=${userLogged.id}`
        )
      ).json()
    ).data || [];
  return array;
}

async function listenToAdminProductToolbar() {
  const addProductBtn = document.querySelector(".admin_add_product_btn");
  const sortSelect = document.getElementById("sort_by");
  const filterSelect = document.getElementById("filter_type");

  if (addProductBtn && !addProductBtn.dataset.listened) {
    addProductBtn.dataset.listened = true;
    addProductBtn.addEventListener("click", async () => {
      await createProductModal();
    });
  }

  if (sortSelect && !sortSelect.dataset.listened) {
    sortSelect.dataset.listened = true;
    sortSelect.addEventListener("change", () => {
      renderFilteredSortedCards();
    });
  }

  if (filterSelect && !filterSelect.dataset.listened) {
    filterSelect.dataset.listened = true;
    filterSelect.addEventListener("change", () => {
      renderFilteredSortedCards();
    });
  }
}

const paintAdminSettings = async () => {
  if (!settingsFromDB.length) await setSettings();
  const mainWrapper = document.querySelector(".main_content_wrapper");
  const adminSettingsComponent = generateDashboardSettings(settingsFromDB);
  mainWrapper.innerHTML = "";
  console.log(adminSettingsComponent);
  mainWrapper.appendChild(adminSettingsComponent);
};
let selectedEntityIndex = 0;
const paintAdminBrandsAndDrops = async () => {
  if (!brandsFromDB.length) await setBrands();
  if (!dropsFromDB.length) await setDrops();
  if (!colorsFromDB.length) await setColors();

  const mainWrapper = document.querySelector(".main_content_wrapper");
  const titleAddProductContainer = document.createElement("div");
  titleAddProductContainer.className = "title_add_product_container";
  titleAddProductContainer.innerHTML = `<div class="top_row_container">
          <div class="select_container">
            <select
              class="ui dropdown entity_picker_select"
              name="entity_picker_select"
            >
              <option value="0">Marcas</option>
              <option value="1">Drops</option>
              <option value="2">Colores</option>
            </select>
          </div>
          <div class="add_entity_container">
            <i class='bx bx-plus add_entity_icon add_icon'></i>
          </div>
        </div>`;
  mainWrapper.appendChild(titleAddProductContainer);
  const tableContainer = document.createElement("div");
  tableContainer.classList.add("table_container");
  const gridTable = document.createElement("div");
  gridTable.className = "ag-theme-alpine";
  gridTable.id = "myGrid";
  tableContainer.appendChild(gridTable);
  mainWrapper.appendChild(tableContainer);
  selectedEntityIndex = 0;
  await entityTableHandler();
  //Para filtrar el dropdown de type de tabla
  $(".ui.dropdown.entity_picker_select").dropdown({
    onChange: async function (value, text, $selectedItem) {
      selectedEntityIndex = parseInt(value);
      // Invoco la funcion que construye la tabla
      await entityTableHandler();
    },
  });

  const addEntityIcon = document.querySelector(".add_entity_icon");
  addEntityIcon.addEventListener("click", async () => {
    switch (selectedEntityIndex) {
      case 0:
        await createBrandModal();
        break;
      case 1:
        await createDropModal();
        break;
      case 2:
        await createColorModal();
        break;

      default:
        break;
    }
  });
};

// 0: Marca | 1: Drop | 2: Colors | 3: Countries | 4: Users
async function entityTableHandler() {
  try {
    const addNewEntityBtn = document.querySelector(".add_entity_icon");
    addNewEntityBtn.classList.remove("disabled");
    let arrayToUse, rowsData, gridData;
    const gridDiv = document.querySelector("#myGrid");
    gridDiv.innerHTML = "";
    switch (selectedEntityIndex) {
      case 0: // Marcas
        if (!brandsFromDB.length) await setBrands();
        arrayToUse = brandsFromDB;
        rowsData = arrayToUse.map((row) => {
          return {
            id: row.id,
            logo: row.logo?.file_urls[0]?.url,
            name: row.name,
            products: row.products?.length,
          };
        });
        gridData = {
          columnDefs: [
            {
              field: "logo",
              width: 90,
              headerName: "Logo",
              cellRenderer: (params) => {
                return `<img src="${params.value}" width="50" height="50" style="filter: invert(1);"/>`;
              },
            },
            { field: "name", flex: 0.8 },
            { field: "products", flex: 0.5 },
          ],
          onRowClicked: async (event) => {
            const brand = brandsFromDB.find(
              (dbBrand) => dbBrand.id === event.data.id
            );
            await handleEntityRowClick(brand);
          },
        };
        gridData.rowData = rowsData;
        break;
      case 1: // Drops
        if (!dropsFromDB.length) await setDrops();
        arrayToUse = dropsFromDB;
        rowsData = arrayToUse.map((row) => {
          return {
            id: row.id,
            nombre: row.name,
            productos: row.products?.length,
            publicado: row.active ? "si" : "no",
            unico: row.unique ? "si" : "no",
            lanzamiento: getDateString(row.launch_date, true),
          };
        });
        gridData = {
          columnDefs: [
            { field: "nombre", flex: 0.8 },
            { field: "productos", flex: 0.5 },
            { field: "publicado", flex: 0.5 },
            { field: "unico", flex: 0.5 },
            { field: "lanzamiento", flex: 1 },
          ],
          onRowClicked: async (event) => {
            const drop = dropsFromDB.find(
              (dbDrop) => dbDrop.id === event.data.id
            );
            await handleEntityRowClick(drop);
          },
        };
        gridData.rowData = rowsData;
        break;
      case 2: // Colors
        if (!colorsFromDB.length) await setColors();
        arrayToUse = colorsFromDB;
        rowsData = arrayToUse.map((row) => {
          return {
            id: row.id,
            nombre: row.name,
          };
        });
        gridData = {
          columnDefs: [{ field: "nombre", flex: 1 }],
          onRowClicked: async (event) => {
            const color = colorsFromDB.find(
              (dbColor) => dbColor.id === event.data.id
            );
            await handleEntityRowClick(color);
          },
        };
        gridData.rowData = rowsData;
        break;
      default:
        break;
    }
    agGrid.createGrid(gridDiv, gridData);
    return;
  } catch (error) {
    return console.log(error);
  }
}
async function handleEntityRowClick(entity) {
  switch (selectedEntityIndex) {
    case 0: //marca
      await createBrandModal(entity);
      break;
    case 1: //drop
      await createDropModal(entity);
      break;
    case 2: //color
      await createColorModal(entity);
      break;
    default:
      break;
  }
}

// MANEJO DE LOS INPUT FILES
// Función para actualizar las opciones del select de posiciones y escuchar cambios
function updatePositionSelects() {
  const imageBoxes = Array.from(document.querySelectorAll(".image_box"));
  const totalImages = imageBoxes.length;

  imageBoxes.forEach((box, index) => {
    const select = box.querySelector(".image_position_select");

    // Guardar la posición actual si existe
    let currentPosition = select.dataset.selected
      ? parseInt(select.dataset.selected)
      : null;

    // Limpiar opciones antes de agregar nuevas
    select.innerHTML = "";

    // Agregar opción de placeholder
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Seleccionar posición";
    placeholderOption.disabled = true;
    select.appendChild(placeholderOption);

    // Agregar opciones numéricas
    for (let i = 1; i <= totalImages; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i === 1 ? "Foto Principal" : i;

      // Seleccionar la opción si coincide con la posición guardada
      if (currentPosition === i) {
        option.selected = true;
      }

      select.appendChild(option);
    }

    // Si no hay posición guardada, dejar el placeholder seleccionado
    if (!currentPosition || currentPosition > totalImages) {
      select.selectedIndex = 0; // Seleccionar placeholder
    }

    // Escuchar cambios en el select para actualizar la posición de la imagen
    select.addEventListener("change", (event) => {
      reorderImages(event.target, imageBoxes);
    });
  });
}

// Función para reordenar imágenes cuando cambia el select
function reorderImages(changedSelect, imageBoxes) {
  const newPosition = parseInt(changedSelect.value);
  const currentImageBox = changedSelect.closest(".image_box");

  // Buscar el select que tenía esta posición antes y resetearlo
  imageBoxes.forEach((box) => {
    const select = box.querySelector(".image_position_select");
    if (parseInt(select.dataset.selected) === newPosition) {
      select.dataset.selected = "";
      select.selectedIndex = 0; // Volver al placeholder
    }
  });

  // Guardar la nueva posición en el dataset
  changedSelect.dataset.selected = newPosition;

  updatePositionSelects(); // Actualizar selects después del cambio
}
// Función para agregar eventos a los botones "Remove"
function addRemoveListeners() {
  document.querySelectorAll(".remove_image_box_anchor").forEach((btn) => {
    if (!btn.dataset.listenerAdded) {
      btn.dataset.listenerAdded = "true"; // Evitar agregar múltiples eventos
      btn.addEventListener("click", (event) => {
        event.stopPropagation(); // Evitar eventos no deseados
        const imageBox = event.target.closest(".image_box");
        imageBox.remove(); // Eliminar la imagen del DOM
        updatePositionSelects(); // Actualizar los selects
      });
    }
  });
}
// ====== BRANDS ======
// Función para actualizar el contenedor de imágenes
export function listenToBrandFileInputs() {
  const inputs = document.querySelectorAll('input[type="file"]');
  inputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      handleFileInputChange(e, (fileData, input) => {
        console.log("Foto de marca procesado:", fileData);
        updateBrandImageContainer(fileData, input);
      });
    });
  });
}
function updateBrandImageContainer(fileData, input) {
  const fieldType = input.name.replace("brand_", ""); // Extrae la parte después de "brand_"
  const container = document.querySelector("." + fieldType + "_field"); // Encuentra el contenedor

  if (!container) return;

  fileData.forEach(({ src }) => paintImgInContainer(container, src));
}
export function paintImgInContainer(container, src) {
  container.innerHTML = ""; // Limpia el contenedor antes de agregar nuevas imágenes
  const img = document.createElement("img");
  img.src = src;
  img.className = `image_to_select_main`; // Aplica la clase para estilos
  container.appendChild(img);
}
// ====== PRODUCT & DROP======
// ====== GENERALIZAR EL MANEJO DE IMÁGENES ======
// Escuchar cambios en un input file específico
export function listenToFileInput(inputName, updateFunction) {
  const input = document.querySelector(`input[name="${inputName}"]`);
  if (!input) return;

  input.addEventListener("change", (e) => {
    handleFileInputChange(e, updateFunction);
  });
}
// Función que maneja la lógica de renderizar imágenes y actualizar selects
export function updateImages(fileData, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Borrar solo imágenes nuevas (input-file) antes de agregar las nuevas
  container
    .querySelectorAll(".image_box.input-file")
    .forEach((el) => el.remove());

  fileData.forEach(({ src, filename }) => {
    const imageObj = { filename };
    addImageToContainer(src, container, false, imageObj);
  });

  updatePositionSelects(); // Actualizar los selects después de agregar nuevas imágenes
}
// Función para agregar imágenes al contenedor con select dinámico
function addImageToContainer(src, container, isExisting = true, image) {
  const position = image?.position || undefined;
  const main_image = image?.main_image || undefined;
  const filename = image?.filename || undefined;
  const id = image?.id || undefined;

  const imageBox = document.createElement("div");
  imageBox.classList.add(
    "field",
    "image_box",
    isExisting ? "old_file" : "input-file"
  );

  imageBox.setAttribute("data-filename", filename);
  if (isExisting) {
    imageBox.setAttribute("data-db_id", id);
  }

  imageBox.innerHTML = `
      ${
        isExisting
          ? '<p class="remove_image_box_anchor no-margin">Remove</p>'
          : ""
      }
      <div class="image_container">
          <img src="${src}" class="image_to_select_main">
      </div>
      <select name="image_position" class="image_position_select required" required data-selected="${
        position || ""
      }">
      </select>
  `;

  container.appendChild(imageBox);

  updatePositionSelects(); // Actualizar opciones del select
  addRemoveListeners(); // Agregar evento al botón de Remove

  // Establecer posición de la imagen si ya existe
  if (position !== null) {
    const select = imageBox.querySelector(".image_position_select");
    select.value = main_image ? "1" : position;
  }
}
// Cargar imágenes existentes al contenedor específico
export function loadExistingImages(existingImages, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = ""; // Limpiar antes de agregar las imágenes del producto

  existingImages.forEach((image) => {
    const src = image.file_urls[0].url;
    addImageToContainer(src, container, true, image);
  });

  updatePositionSelects(); // Asegurar que los selects se actualicen correctamente
}

function renderFilteredSortedCards() {
  const cardsWrapper = document.querySelector(".products_cards_wrapper");
  if (!cardsWrapper) return;

  cardsWrapper.innerHTML = "";

  const sortBy = document.getElementById("sort_by")?.value || "name";
  const filterType = document.getElementById("filter_type")?.value || "all";

  let filtered = [...productsFromDB];

  // Filtros
  if (filterType === "dobleuso") {
    filtered = filtered.filter((p) => p.is_dobleuso);
  } else if (filterType === "dobleclover") {
    filtered = filtered.filter((p) =>
      p.brand?.name?.toLowerCase().includes("dobleclover")
    );
  } else if (filterType === "active") {
    filtered = filtered.filter((p) => p.active);
  } else if (filterType === "discount") {
    filtered = filtered.filter((p) => p.discount > 0);
  }

  // Orden
  const [sortField, sortOrder] = sortBy.split("_");

  filtered.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "stock") {
      aVal = a.totalStock || 0;
      bVal = b.totalStock || 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    if (sortField === "brand") {
      aVal = a.brand?.name?.toLowerCase() || "";
      bVal = b.brand?.name?.toLowerCase() || "";
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    if (sortField === "price") {
      const aNum = parseFloat(a.price) || 0;
      const bNum = parseFloat(b.price) || 0;
      return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
    }

    return 0;
  });

  // Render
  const fragment = document.createDocumentFragment();
  filtered.forEach((prod) => {
    const card = renderAdminProductCard(prod);
    card.addEventListener("click", () => handleProductRowClick(prod));
    fragment.appendChild(card);
  });

  cardsWrapper.appendChild(fragment);
}

function updateFilterOptionCounts() {
  const select = document.getElementById("filter_type");
  if (!select) return;

  const all = productsFromDB.length;
  const dobleuso = productsFromDB.filter((p) => p.is_dobleuso).length;
  const dobleclover = productsFromDB.filter((p) => !p.is_dobleuso).length;
  const active = productsFromDB.filter((p) => p.active).length;
  const discount = productsFromDB.filter((p) => p.discount > 0).length;

  select.querySelector(
    'option[value="all"]'
  ).textContent = `Todos los productos (${all})`;
  select.querySelector(
    'option[value="dobleuso"]'
  ).textContent = `Productos DobleUso (${dobleuso})`;
  select.querySelector(
    'option[value="dobleclover"]'
  ).textContent = `Productos DobleClover (${dobleclover})`;
  select.querySelector(
    'option[value="active"]'
  ).textContent = `Productos activos (${active})`;
  select.querySelector(
    'option[value="discount"]'
  ).textContent = `Productos con descuento (${discount})`;
}
// Obtener cupones desde el backend
async function paintAdminCoupons() {
  const mainWrapper = document.querySelector(".main_content_wrapper");
  mainWrapper.innerHTML = ""; // Limpiamos antes de pintar
  // Toolbar superior con botón "Generar cupón"
  const toolbar = document.createElement("div");
  toolbar.className = "admin_products_toolbar admin_toolbar";

  toolbar.innerHTML = `
  <div class="admin_toolbar_left">
    <button class="admin_add_coupon_btn admin_primary_btn">
      <i class="bx bx-plus"></i> Generar cupón
    </button>
    <button class="admin_disable_coupon_btn admin_negative_btn">
      <i class="bx bx-block"></i> Dar de baja cupón
    </button>
  </div>
`;

  mainWrapper.appendChild(toolbar);
  const titleRow = document.createElement("div");
  titleRow.className = "title_add_product_container";
  titleRow.innerHTML = `
    <div class="top_row_container">
      <h2>Cupones</h2>
    </div>`;
  mainWrapper.appendChild(titleRow);

  const tableContainer = document.createElement("div");
  tableContainer.classList.add("table_container");

  const gridTable = document.createElement("div");
  gridTable.className = "ag-theme-alpine";
  gridTable.id = "myGrid";
  // gridTable.style.height = "450px"; // Ajustá si necesitás otro tamaño

  tableContainer.appendChild(gridTable);
  mainWrapper.appendChild(tableContainer);

  if (!coupons.length) await setCoupons();

  // Columnas para AG Grid
  const columnDefs = [
    { headerName: "Nombre", cellClass: "copy_p", field: "code", flex: 1 },
    { headerName: "% Descuento", field: "discount_percent", flex: 1 },
    {
      headerName: "Activo",
      field: "activo",
      valueGetter: (params) => {
        const c = params.data;
        const expired = c.expires_at && new Date(c.expires_at) < new Date();
        const reachedMax =
          c.usage_limit !== null && c.usage_count >= c.usage_limit;
        return !expired && !reachedMax ? "Sí" : "No";
      },
      flex: 1,
    },
    {
      headerName: "Usos",
      field: "uses",
      valueGetter: (params) => {
        const c = params.data;
        return c.usage_limit
          ? `${c.usage_count}/${c.usage_limit}`
          : `${c.usage_count}`;
      },
      flex: 1,
    },
    {
      headerName: "Expira en",
      field: "expiresAt",
      valueGetter: (params) => {
        const fecha = params.data.expires_at;
        if (!fecha) return "—";
        const expirada = new Date(fecha) < new Date();
        return expirada
          ? "Expiró"
          : new Date(fecha).toLocaleDateString("es-AR");
      },
      flex: 1,
    },
  ];
  agGrid.createGrid(gridTable, {
    columnDefs,
    rowData: [...coupons],
    rowSelection: "single", // 👈 Esto permite seleccionar solo una fila
  });
  // Listener para el botón
  document
    .querySelector(".admin_add_coupon_btn")
    .addEventListener("click", async () => {
      await createCouponModal(); //
    });
  document
    .querySelector(".admin_disable_coupon_btn")
    .addEventListener("click", async () => {
      const selected = gridTable.querySelector(".ag-row-selected");
      if (!selected)
        return showCardMessage(false, "Seleccioná un cupón de la lista.");

      const rowIndex = selected.getAttribute("row-index");
      const couponToDisable = coupons[parseInt(rowIndex)];
      if (couponToDisable) await createDisableCouponModal(couponToDisable);
    });
  // Para ver si toca los nombres de los cupones
  // Escuchar clicks en celdas con clase "copy_p"
  gridTable.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("copy_p")) {
      const textToCopy = target.innerText;
      copyElementValue(textToCopy);
      activateCopyMsg();
    }
  });
}

export { userProfileExportObj };

function setUserProfilePlaceholder() {
  let placeholderElement;
  //esta funcion dependiendo que viene invoca a la funcion que pinta/despinta las cosas
  switch (activeIndexSelected) {
    case 0: //Profile | Ventas
    placeholderElement = typeOfPanel === 2 ? renderProfilePlaceholder() : '';
      break;
    case 1: //Addresses | Products
    placeholderElement = typeOfPanel === 2 ? renderUserAddressesPlaceholder() : '';
      break;
    case 2: //Phones | marcas & drops
    placeholderElement = typeOfPanel === 2 ? renderUserPhonesPlaceholder() : '';
      break;
    case 3: //Order History | coupons
    placeholderElement = typeOfPanel === 2 ? renderUserOrdersPlaceholder() : '';
      break;
    case 4: 
    placeholderElement = typeOfPanel === 2 ? null : null;
      break;
    default:
      break;
  };
   //aca ya tengo el placeholder, lo agrego primero
   document.querySelector('.main').prepend(placeholderElement);
   return 
}
