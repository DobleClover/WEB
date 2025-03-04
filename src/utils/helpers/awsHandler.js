// librerias
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import path from "path";
import generateRandomNumber from "./generateRandomNumber.js";
import { v4 as uuidv4 } from "uuid";
// ENV
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
const bucketSecretAccessKey = process.env.BUCKET_SECRET_KEY;
// Creo el objeto
const s3 = new S3Client({
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretAccessKey,
  },
  region: bucketRegion,
});

//retorna los objetos para pushear a la DB
export async function uploadFilesToAWS(object) {
  try {
    // Voy por los home_files
    let randomName, buffer, command, params, filesToInsertDB;
    filesToInsertDB = [];
    for (let i = 0; i < object.files.length; i++) {
      randomName = null;
      const multerFile = object.files[i];
      // Lo agrego a aws
      if (multerFile) {
        const randomNumber = generateRandomNumber(10); //el length
        const validBuffer = Buffer.isBuffer(multerFile.buffer)
            ? multerFile.buffer
            : Buffer.from(multerFile.buffer.data);
        if (multerFile.file_types_id == 1) {
            //imagen
            
          // Utiliza Sharp para obtener información de la imagen (incluido el ancho)
          const imageInfo = await sharp(validBuffer).metadata();
          const imageWidth = imageInfo.width;
          // Creo el nombre unico para la foto (dentro del forEach)
          // Cambio el formato a webp y redimensiono la imagen, total la de los productos
        randomName = `${object.folderName}-` + randomNumber;
          let imageSizes = [
            //Por cada foto subo otras 2 mas chicas para optimizar la carga
            {
              name: randomName + "-2x.webp", //original
              width: Math.round(imageWidth * 1),
            },
            {
              name: randomName + "-1x.webp",
              width: Math.round(imageWidth * 0.5),
            },
            {
              name: randomName + "-thumb.webp",
              width: 20,
            },
          ];  
          // Voy por cada size asi lo subo a aws
          for (let j = 0; j < imageSizes.length; j++) {
            const imageToUpload = imageSizes[j];
            //  no se necesita tan gde
            console.log('buffering image...')
            buffer = await sharp(validBuffer)
              .resize(imageToUpload.width, undefined, {
                fit: "contain",
                //background: { r: 255, g: 255, b: 255, alpha: 0 },
              })
              .toFormat("webp")
              .toBuffer();
            // El objeto de la imagen que voy a subir
            params = {
              Bucket: bucketName,
              Key: `${object.folderName}/${imageToUpload.name}`, //Esto hace que se guarde en la carpeta homeSection
              Body: buffer,
              ContentType: "image/webp",
            };
            console.log('uploading image...')
            command = new PutObjectCommand(params);
            await s3.send(command);
            console.log('image succesfully uploaded')
          }
        } else{
            const videoExtension = path.extname(multerFile.originalname); // Obtiene ".mp4", ".jpg", etc.
            //aca es video
            randomName = `${object.folderName}-` + randomNumber + videoExtension; //nombre del archivo
            // Lo unico que hago es rescribir la imagen que ya estaba   
            params = {
                Bucket: bucketName,
                Key: `${object.folderName}/${randomName}`,//Esto hace que se guarde en la carpeta homePage, y que sobreEscriba a la foto vieja
                Body: validBuffer,
                ContentType: multerFile.mimetype
            };
            command = new PutObjectCommand(params);
        await s3.send(command);
        }        
      }
      // Si estoy aca entonces lo pusheo en db
      console.log('multer file handler')
      console.log(multerFile)
      let fileObject = {
        id: uuidv4(),
        filename: randomName ? randomName : multerFile.filename, //Si no viene randomName es que ya estaba en db
        main_file: multerFile.main_file,
        file_types_id: multerFile.file_types_id, //imagen, video
        sections_id: object.sections_id,
      };
      filesToInsertDB?.push(fileObject);   
    }
    return filesToInsertDB;
  } catch (error) {
    console.log(`Falle en uploadFileToAWS: ${error}`);
    return null;
  }
}

//No retorna nada
export async function destroyFilesFromAWS(object){
  try {
    let params,command;
    console.log('iterating over files...')
    for (let i = 0; i < object.files.length; i++) {
        let file = object.files[i];
        if(file.file_types_id == 1){
            for (let j = 1; j <= 3; j++) {
                //El 5 es el thumb
                const factor = j <= 2 ? `-${j}x.webp` : "-thumb.webp"; //Para ir por todas las resoluciones
                const fileToDestroy = `${file.filename}${factor}`;
                params = {
                  Bucket: bucketName,
                  Key: `${object.folderName}/${fileToDestroy}`,
                };
                command = new DeleteObjectCommand(params);
                // Hago el delete de la base de datos
                console.log('deleting photo...')
                await s3.send(command);
              }
        } else{
            //aca es video
            params = {
                Bucket: bucketName,
                Key: `${object.folderName}/${file.filename}`,
              };
              command = new DeleteObjectCommand(params);
              // Hago el delete de la base de datos
              console.log('deleting video...')
              await s3.send(command);
        }
        
    }
    return true;
  } catch (error) {
    console.log(`error destroying files in aws: ${error}`);
    return false;
  }
    
}

//Retorna los files con sus urls
export async function getFilesFromAWS(object){  
  try {
    for (let i = 0; i < object.files?.length; i++) {
      const file = object.files[i];      
      file.file_urls = [];
      let url,params,command;
      if(file.file_types_id == 1){ //FOTO
        for (let j = 3; j >= 1; j--) {          
          const factor = j <= 2 ? `${j}x` : "thumb"; //Para ir por todas las resoluciones
          const filename = `${file.filename}-${factor}.webp`;
          params = {
            Bucket: bucketName,
            Key: `${object.folderName}/${filename}`,
          };
          command = new GetObjectCommand(params);
          url = await getSignedUrl(s3, command, { expiresIn: 1800 }); //30 min
          j <= 2 ? file.file_urls.push({ url, size: factor }) : file.thumb_url = url; //en el href product.files[x].file_url
          
          
        }
      } else {
        params = {
          Bucket: bucketName,
          Key: `${object.folderName}/${file.filename}`,
        };
        command = new GetObjectCommand(params);
        url = await getSignedUrl(s3, command, { expiresIn: 1800 }); //30 min        
        file.file_urls.push({ url })
      }
       //en el href product.files[x].file_url
    }
    
    return 
  } catch (error) {
    console.log('falle');
    return console.log(error);
    
  }
}
