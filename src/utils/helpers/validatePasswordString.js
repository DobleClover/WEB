export default function validateString(input) {
    // Verifica si el string tiene al menos 8 caracteres
    if (input.length < 8) return false;

    // Verifica si contiene al menos una letra mayúscula
    if (!/[A-Z]/.test(input)) return false;

    // Si pasa ambas validaciones, retorna true
    return true;
}

