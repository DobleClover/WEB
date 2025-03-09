document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
  const header = document.querySelector(".header");
  const isAtTop = function () {
    //Para saber si esta arriba de todo
    return (
      (document.documentElement.scrollTop || document.body.scrollTop) === 0
    );
  };
  const headerShow = () => { //Para hacer el header aparezca/desaparezca
    let prevScrollPos = window.pageYOffset;
    window.onscroll = function () {
        
        let minScroll = window.scrollY >= window.innerHeight * 0.1; //Mayor a 10vh
        let currentScrollPos = window.pageYOffset;
        if(minScroll){
            if (prevScrollPos > currentScrollPos) { //Scroll Up
                header.classList.add('header_active');
                header.classList.remove('header_hidden');

            } else { //Scroll Down
                header.classList.remove('header_active');
                header.classList.add('header_hidden');
            }
        }    
        if (isAtTop()) {
            header.classList.remove('header_hidden');
            header.classList.remove('header_active');
        }
        prevScrollPos = currentScrollPos;
    }
}

  headerShow();

  function activateHeaderDropdowns() {
    $(".header .menu.nav-link-item .browse").popup({
      inline: true,
      hoverable: true,
      position: "bottom left",
      delay: {
        show: 150,
        hide: 600,
      },
    });
    if (SCREEN_WIDTH > 768) {
      $(".header .menu.user-initials-container .browse").popup({
        inline: true,
        hoverable: true,
        position: "bottom right",
        delay: {
          show: 150,
          hide: 600,
        },
      });
    } else {
      decideAndListenForMobileUserInitialsClick();
    }
  }
});
