import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
// Obtener la ruta absoluta del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../utils/staticDB/countries.js");
const controller = {
  index: (req, res) => {
   return res.send("actualizados!");
  },
};

export default controller;
