document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
    const header = document.querySelector(".header");
    // const headerTopInfo = document.querySelector(".header_top_info");
    // const spacer = document.createElement("div"); // Crear el espaciador

    // // Definir la altura inicial del espaciador igual a la altura del header
    // spacer.style.height = `${header.offsetHeight}px`;

    // // Insertar el espaciador antes del header en el DOM
    // header.parentNode.insertBefore(spacer, header);

    // const headerTopHeight = headerTopInfo.offsetHeight;

    // window.addEventListener("scroll", () => {
    //     if (window.scrollY > headerTopHeight) {
    //         header.classList.add("sticky");
    //         spacer.style.display = "block"; // Mostrar el espaciador cuando el header sea fijo
    //     } else {
    //         header.classList.remove("sticky");
    //         spacer.style.display = "none"; // Ocultar el espaciador cuando el header vuelva a su posición original
    //     }
    // });
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
          let minScroll = window.scrollY >= window.innerHeight * 0.25; //Mayor a 10vh
          let scrollToPaintBackground = window.scrollY >= window.innerHeight * 0.45;
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
              scrollToPaintBackground ? header.classList.remove("header_dark"): null;
            }           
          }
          if (isAtTop()) {
            header.classList.remove("header_hidden");
            header.classList.remove("header_active");
            header.classList.add("header_dark");
          }
          prevScrollPos = currentScrollPos;
        };
      };
    
      headerShow();
});