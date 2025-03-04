import { URL } from 'url';

export default function(path){
    if (!path) return null;

    // Crear una instancia de URL y obtener el pathname
    const { pathname } = new URL(path, 'http://localhost'); // Usa un dominio base si el path no tiene uno
    return pathname;
};
