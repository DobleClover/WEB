import db from "../../database/models/index.js";
import getDeepCopy from "./getDeepCopy.js";

export async function findFilesInDb(productId = undefined)  {
    try {
        if(!productId)return [];
        let files = await db.File.findAll({
            where: {
                products_id: productId
            }
        });
        files = getDeepCopy(files);
        return files;
    } catch (error) {
        console.log(`Error finding files in db: ${error}`);
        return [];
    }
}

export async function deleteFileInDb(imagesId)  {
    try {
        if(!imagesId || !imagesId.length)return true;
        await db.File.destroy({
            where: {
                id: imagesId
            }
        })
        return true;
    } catch (error) {
        console.log(`Error deleting file in db ${error}`);
        console.log(error);
        return false;
    }
}

export async function insertFilesInDb(files, productId) {
    try {
        if(!files || !files.length) return true
        const filesWithProductId = files.map(file => ({
            ...file,
            products_id: productId,
        }));
        await db.File.bulkCreate(filesWithProductId, {
            updateOnDuplicate: [
                'main_file'
            ]
        });
        return true;
    } catch (error) {
        console.log(`Error inserting files in db: ${error}`);
        console.log(error);
        return false;
    }
}