import fs from "fs";
import path from "path";

/**
 * Convierte una imagen a Base64 y retorna un src listo para usar en HTML
 * @param {string} imagePath - Ruta de la imagen (relativa o absoluta)
 * @returns {string} - String Base64 con el formato data:image/...
 */
export default function getBase64ImageSrc(imagePath) {
  try {
    // Resolver la ruta absoluta
    const absolutePath = path.resolve(imagePath);
    
    // Obtener la extensión del archivo
    const extension = path.extname(imagePath).substring(1); // Sin el punto
    
    // Determinar el MIME type
    const mimeType = extension === "svg" ? "image/svg+xml" : `image/${extension}`;
    
    // Leer la imagen y convertirla a Base64
    const base64Data = fs.readFileSync(absolutePath).toString("base64");
    
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error("Error al convertir la imagen a Base64:", error);
    return "";
  }
}
