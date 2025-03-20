export default function capitalizeFirstLetter(string) {
    if(!string)return;
    // Convierte el primer carácter a mayúscula y el resto del string a minúsculas
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}