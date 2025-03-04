export default function getOnlyNumbers(string) {
    // Usar expresión regular para eliminar todo lo que no sean números
    return string.replace(/\D/g, '');
}