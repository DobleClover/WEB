import { userLogged } from "./checkForUserLogged.js";
import { generateUserVerifySection } from "./componentRenderer.js";
import {
  checkForNumericInputs,
  disableBtn,
  isOnPage,
  scriptInitiator,
  showCardMessage,
} from "./utils.js";
const userVerifyExportObj = {
  pageConstructor: null,
};
window.addEventListener("load", async () => {
  try {
    if (!isOnPage("/verificar")) return;
    await scriptInitiator();
    userVerifyExportObj.pageConstructor = function () {
      const main = document.querySelector(".main");
      main.innerHTML = "";
      let userVerifyContainer = generateUserVerifySection();
      main.appendChild(userVerifyContainer);

      checkForNumericInputs();
      // Logica para ir cambiando de input a medida que se escribe
      const inputs = Array.from(
        document.querySelectorAll(".verify-code-input")
      );
      const verifyButton = document.querySelector(".verify_button");
      // Itero por cada uno
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        let lastInputValue = "";
        // Evento si cambia el input
        input.addEventListener("input", (e) => {
          verifyButton.classList.add("disabled");
          if (input.value.length <= 1) {
            lastInputValue = input.value;
            // Si no es el ultimo paso le focus
            if (input.value.length === 1) {
              input.blur();
              if (i < inputs.length - 1) {
                inputs[i + 1].focus();
              }
            }
          } else {
            //Si ya tenia, le dejo el mismo valor de antes
            input.value = lastInputValue;
          }
          checkForAllInputsFilled();
        });
        if (i == 0) {
          // Evento si hacen un paste en el input
          input.addEventListener("paste", (e) => {
            input.blur();
            const valueToPaste = e.clipboardData || window.clipboardData;
            // Agarro el codigo en un array
            const codeToPasteArray = valueToPaste
              .getData("text")
              .split("")
              .filter((num) => !isNaN(parseInt(num)));
            console.log(codeToPasteArray);
            codeToPasteArray.forEach((digit, j) => {
              if (j <= 5) {
                inputs[j].value = digit;
              }
            });
            checkForAllInputsFilled();
          });
        }
      }
      // Capturo cuando le da a "Reenviar codigo"
      const resendCode = document.querySelector(".resend-code");
      resendCode.addEventListener("click", async (e) => {
        try {
          // Pinto el boton de disabled
          resendCode.classList.add("loading");
          // Hago el fetch
          let response = await fetch(
            `${window.location.origin}/api/user/send-verification-code?users_id=${userLogged.id}`
          );
          response = await response.json();
          let msg;
          // si no da ok
          if (!response.ok) {
            msg =
              "Ha ocurrido un error al mandar el codigo, intente nuevamente";
            // Armo tarjeta de error
            showCardMessage(false, msg);
            return;
          }
          // Aca dio bien ==> Pinto el mensaje avisando que se envio
          resendCode.classList.remove("loading");
          // Armo tarjeta de success
          msg = response?.msg;
          showCardMessage(true, msg);
          // Si dio ok, lo dejo disabled 1 minuto
          disableBtn(resendCode, 60000);
          return;
        } catch (error) {
          return console.log(
            `Falle en verifyButton.addEventListener: ${error}`
          );
        }
      });
      // Capturo cuando le da a "Verificar codigo"
      verifyButton.addEventListener("click", async (e) => {
        try {
          let code = "";
          inputs.forEach((inp) => {
            if (inp.value.length == 0) e.preventDefault();
            code += inp.value;
          });
          verifyButton.classList.add("loading");
          let response = await fetch(
            `${window.location.origin}/api/user/check-verification-code?users_id=${userLogged?.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code }),
            }
          );
          // Antes de hacer el fetch le hago el disabled
          response = await response.json();
          verifyButton.classList.remove("loading");
          let msg = response?.msg;
          if (!response.ok) {
            // Armo tarjeta de error
            showCardMessage(false, msg);
            inputs.forEach((inp) => (inp.value = ""));
            return;
          }
          // Aca dio bien ==> Pinto el mensaje de ok
          // Armo tarjeta de error
          showCardMessage(true, msg);
          setTimeout(() => {
            window.location.href = `/`;
          }, 1000);
          return;
        } catch (error) {
          console.log(`Falle en verifyButton.addEventListener: ${error}`);
          return console.log(error);
        }
      });
      function checkForAllInputsFilled() {
        // Me fijo si todos estan con value, si es asi hablito el boton
        const inputsNotFilled = inputs.find((inp) => inp.value.length == 0);
        // Si no hay ninguno, le saco el disabled
        if (!inputsNotFilled) verifyButton.classList.remove("disabled");
      }
    };
    userVerifyExportObj.pageConstructor();
  } catch (error) {
    return console.log(error);
  }
});

export { userVerifyExportObj };
