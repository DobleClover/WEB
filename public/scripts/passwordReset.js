import { generateTooltip } from "./componentRenderer.js";
import { validateUserSignUpForm } from "./formValidators.js";
import { scriptInitiator, showCardMessage, toggleInputPasswordType } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  await scriptInitiator();
  const form = document.querySelector(".reset_password_form");

  // Tooltip con requisitos de contraseña
  const passwordRequirements = [
    "Longitud mínima: 8 caracteres",
    "Al menos 1 mayúscula",
  ];
  const passwordTooltip = generateTooltip(passwordRequirements);
  const passwordFieldLabel = document.querySelector(".password-field label");
  passwordFieldLabel.appendChild(passwordTooltip);

  $(".tooltip-icon").popup({
    popup: $(".tooltip-content"),
    on: "hover",
    hoverable: true,
    position: "left center",
  });

   // Activar toggle de contraseña
   document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", toggleInputPasswordType);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const isValid = validateUserSignUpForm(form);
    if (!isValid) return;
  
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.classList.add("loading","disabled")
  
    const password = form.querySelector("input[name='user-password']").value;
    const token = new URLSearchParams(window.location.search).get("token");
  
    if (!token) {
      showCardMessage(false, "Token no válido o faltante.");
      submitBtn.classList.remove("loading","disabled")
      return;
    }
  
    try {
      const res = await fetch("/api/user/check-password-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password,rePassword:form["user-re-password"].value, token }),
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.ok) {
        const msg = data.msg || "No se pudo actualizar la contraseña.";
        showCardMessage(false, msg);
        submitBtn.classList.remove("loading","disabled")
      } else {
        showCardMessage(true, "Contraseña actualizada correctamente. Redirigiendo...");
        // Redirigir después de un delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      showCardMessage(false, "Error al conectar con el servidor.");
    } finally {
        submitBtn.classList.remove("loading","disabled")
    }
  });
  
});
