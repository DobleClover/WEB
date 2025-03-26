// librerias
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { PassThrough } from "stream";
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
  const filesToInsertDB = [];
  const uploadQueue = [];

  for (const multerFile of object.files) {
    if (!multerFile) continue;

    const startTotal = Date.now();
    const randomNumber = generateRandomNumber(10);
    const validBuffer = Buffer.isBuffer(multerFile.buffer)
      ? multerFile.buffer
      : Buffer.from(multerFile.buffer.data);

    let randomName = null;

    if (multerFile.file_types_id === 1) {
      const imageInfo = await sharp(validBuffer).metadata();
      const imageWidth = imageInfo.width;
      randomName = `${object.folderName}-${randomNumber}`;

      const imageSizes = [
        { name: `${randomName}-2x.webp`, width: imageWidth, label: "2x" },
        { name: `${randomName}-1x.webp`, width: Math.round(imageWidth * 0.5), label: "1x" },
        { name: `${randomName}-thumb.webp`, width: 20, label: "thumb" },
      ];

      for (const image of imageSizes) {
        const transformer = sharp(validBuffer)
          .resize(image.width, undefined, { fit: "contain" })
          .toFormat("webp");

        const stream = new PassThrough();
        transformer.pipe(stream);

        const params = {
          Bucket: bucketName,
          Key: `${object.folderName}/${image.name}`,
          Body: stream,
          ContentType: "image/webp",
        };

        const command = new PutObjectCommand(params);

        const uploadStart = Date.now();
        const logPrefix = `[${image.label}] ${image.name}`;

        const uploadPromise = s3.send(command)
          .then(() => {
            console.log(`✅ ${logPrefix} subida en ${Date.now() - uploadStart}ms`);
          })
          .catch((err) => {
            console.error(`❌ Error subiendo ${logPrefix}:`, err);
          });

        uploadQueue.push(uploadPromise);

        if (uploadQueue.length >= 2) {
          await Promise.allSettled(uploadQueue);
          uploadQueue.length = 0;
        }
      }

    } else {
      // archivo no imagen
      const extension = path.extname(multerFile.originalname);
      randomName = `${object.folderName}-${randomNumber}${extension}`;

      const params = {
        Bucket: bucketName,
        Key: `${object.folderName}/${randomName}`,
        Body: validBuffer,
        ContentType: multerFile.mimetype,
      };

      const uploadStart = Date.now();
      const command = new PutObjectCommand(params);

      const uploadPromise = s3.send(command)
        .then(() => {
          console.log(`✅ Archivo ${randomName} subido en ${Date.now() - uploadStart}ms`);
        })
        .catch((err) => {
          console.error(`❌ Error subiendo archivo ${randomName}:`, err);
        });

      uploadQueue.push(uploadPromise);
      if (uploadQueue.length >= 2) {
        await Promise.allSettled(uploadQueue);
        uploadQueue.length = 0;
      }
    }

    filesToInsertDB.push({
      ...multerFile,
      id: uuidv4(),
      filename: randomName ?? multerFile.filename,
      sections_id: object.sections_id,
    });

    console.log(`📂 Procesado archivo: ${multerFile.originalname} en ${Date.now() - startTotal}ms`);
  }

  if (uploadQueue.length > 0) {
    await Promise.allSettled(uploadQueue);
  }

  return filesToInsertDB;
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
