import multer from 'multer';

// Esto es para usar la memoria, se valida, modifica la foto en memoria y despues se lleva
// a S3 sin pasar for fs
const storage = multer.memoryStorage();
const upload= multer({ storage:storage });

export default upload;