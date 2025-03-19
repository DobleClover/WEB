export const getLocalStorageItem = (key) => {
  const item = localStorage.getItem(key);
  try {
      return JSON.parse(item);
  } catch (e) {
      return item;  
  }
};

export function setLocalStorageItem(keyName, dataToSave, isArray = false) {
  if (!isArray) {
    // Si no es array, simplemente guarda el dato
    return localStorage.setItem(keyName, JSON.stringify(dataToSave));
  }

  let existingData;

  try {
      // Intenta obtener y parsear el array existente
      existingData = JSON.parse(localStorage.getItem(keyName)) || [];
      // Verifica que realmente sea un array
      if (!Array.isArray(existingData)) {
          existingData = [];
      }
  } catch (error) {
      // Si hay un error en el parseo, inicia con un array vacío
      existingData = [];
  }
  // Agrega el nuevo dato al array
  existingData.push(dataToSave);

  // Guarda el array actualizado en localStorage
  localStorage.setItem(keyName, JSON.stringify(existingData));
  }

export const deleteLocalStorageItem = (key) => {
    localStorage.removeItem(key);
}

