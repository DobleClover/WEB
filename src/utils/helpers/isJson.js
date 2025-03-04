export default function isJSON(data) {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'object'; // Verifica si el resultado es un objeto JSON
    } catch (error) {
      return false; // Si ocurre un error al analizar, no es un JSON válido
    }
  }
  return false; // Si no es una cadena de texto, no es JSON
}