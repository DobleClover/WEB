import { saveSetting } from "../utils.js";

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