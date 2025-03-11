import { createUserLoginModal } from "./componentRenderer.js";
import { handlePageModal } from "./utils.js";

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
  console.log("hola");
  
  const header = document.querySelector(".header");
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
  function activateMobileMenu() {
    const burguerMenuIcon = document.querySelector(".menu_logo");
    const menuMobile = document.querySelector(".mobile_menu");
    const closeMenu = document.querySelector(".close_menu");
    burguerMenuIcon?.addEventListener("click", () => {
      menuMobile.classList.add("mobile_menu_active");
      document.body.classList.add("noScroll");
    });
    closeMenu.addEventListener("click", () => {
      menuMobile.classList.remove("mobile_menu_active");
      document.body.classList.remove("noScroll");
    });
    // Cerrar menú si se hace clic fuera
    document.addEventListener("click", (event) => {
      if (
        !menuMobile.contains(event.target) &&
        !burguerMenuIcon.contains(event.target)
      ) {
        menuMobile.classList.remove("mobile_menu_active");
        document.body.classList.remove("noScroll");
      }
    });
    // Activo el acoridon
    $(".mobile_menu .ui.accordion").accordion();
  }
  activateMobileMenu();

  function listenToUserLogoClick() {
    const userLogos = document.querySelectorAll(".unlogged_user_icon");
    userLogos.forEach((element) => {
      if (element.dataset.listened) return;
      element.dataset.listened = true;
      element.addEventListener("click", () => {
        createUserLoginModal();
        handlePageModal(true);
      });
    });
  }
  listenToUserLogoClick();
});
