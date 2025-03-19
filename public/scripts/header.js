import { userLogged } from "./checkForUserLogged.js";
import {
  createUserLoginModal,
  generateUserLoggedDropdown,
} from "./componentRenderer.js";
import { getLocalStorageItem } from "./localStorage.js";
import { handlePageModal } from "./utils.js";

const headerExportObject = {
  headerScriptInitiator: null,
};
window.addEventListener("load", async () => {
  try {
    const header = document.querySelector("header");
    const isAtTop = function () {
      //Para saber si esta arriba de todo
      return (
        (document.documentElement.scrollTop || document.body.scrollTop) === 0
      );
    };
    const headerShow = () => {
      //Para hacer el header aparezca/desaparezca
      let prevScrollPos = window.pageYOffset;
      window.onscroll = function () {
        let minScroll = window.scrollY >= window.innerHeight * 0.1; //Mayor a 10vh
        let currentScrollPos = window.pageYOffset;
        if (minScroll) {
          if (prevScrollPos > currentScrollPos) {
            //Scroll Up
            header.classList.add("header_active");
            header.classList.remove("header_hidden");
          } else {
            //Scroll Down
            header.classList.remove("header_active");
            header.classList.add("header_hidden");
          }
        }
        if (isAtTop()) {
          header.classList.remove("header_hidden");
          header.classList.remove("header_active");
        }
        prevScrollPos = currentScrollPos;
      };
    };

    headerShow();
    // Para abrir el menu
    const menuMobile = document.querySelector(".mobile_menu");
    function activateMobileMenu() {
      const burguerMenuIcon = document.querySelector(".menu_logo");
      const closeMenu = document.querySelector(".close_menu");
      burguerMenuIcon?.addEventListener("click", () => {
        menuMobile.classList.add("mobile_menu_active");
        document.body.classList.add("noScroll");
      });
      closeMenu.addEventListener("click", () => {
        closeMobileMenu()
      });
      // Cerrar menú si se hace clic fuera
      document.addEventListener("click", (event) => {
        if (
          !menuMobile.contains(event.target) &&
          !burguerMenuIcon.contains(event.target)
        ) {
          closeMobileMenu();
        }
      });
      // Activo el acoridon
      $(".mobile_menu .ui.accordion").accordion();
    }
    activateMobileMenu();
    function closeMobileMenu(){
      menuMobile.classList.remove("mobile_menu_active");
      document.body.classList.remove("noScroll");
    }
    function listenToUserLogoClick() {
      const userLogos = document.querySelectorAll(".unlogged_user_icon");
      userLogos.forEach((element) => {
        if (element.dataset.listened) return;
        element.dataset.listened = true;
        element.addEventListener("click", () => {
          closeMobileMenu();
          createUserLoginModal();
          handlePageModal(true);
        });
      });
    }
    listenToUserLogoClick();
    headerExportObject.headerScriptInitiator = function () {
      checkCartItemsToPaintQuantity();
      paintUserIconOrLetter();
    };
  } catch (error) {
    console.log(error);
  }
});

export const paintUserIconOrLetter = () => {
  const unloggedContainers = document.querySelectorAll(
    ".unlogged_user_container"
  );

  if (userLogged) {
    unloggedContainers.forEach((element) => element.classList.add("hidden"));

    const userLoggedDropdownToChange = document.querySelector(
      ".user_initials_container"
    );

    const userInitialsDropdown = generateUserLoggedDropdown();
    userLoggedDropdownToChange.parentNode.replaceChild(
      userInitialsDropdown,
      userLoggedDropdownToChange
    );
    activateHeaderDropdowns();
    // Esto es para el menu mobile
    const mobileMenuUserLoggedContainer = document.querySelector(
      ".mobile_menu_logged_container"
    );
    mobileMenuUserLoggedContainer.innerHTML = `<i class="bx bx-user"></i> ${userLogged.name}`;
  } else {
    unloggedContainers.forEach((element) => element.classList.remove("hidden"));
  }
};

function activateHeaderDropdowns() {
  $(document).ready(function () {
    $("header .menu.user_initials_container .browse").popup({
      inline: true,
      hoverable: true,
      position: "bottom right",
      setFluidWidth: false, // Asegura que no sea demasiado angosto
      variation: "wide", // Usa una variación de ancho
      lastResort: "bottom right",
      delay: {
        show: 150,
        hide: 600,
      },
    });
  });
}

export const checkCartItemsToPaintQuantity = (loggedOut = false) => {
  let tempCartItems;
  if (userLogged && !loggedOut) {
    tempCartItems = userLogged.tempCartItems || [];
  } else {
    const noUserLoggedCartItems = getLocalStorageItem("cartItems");
    if (!noUserLoggedCartItems) {
      tempCartItems = [];
    } else {
      tempCartItems = noUserLoggedCartItems;
    }
  }
  const cartNumberContainers = document.querySelectorAll(
    ".cart_items_length_span"
  );
  cartNumberContainers.forEach(
    (element) => (element.textContent = tempCartItems.length)
  );
};

export { headerExportObject };
