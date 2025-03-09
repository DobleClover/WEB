import db from "../../database/models/index.js";
import getDeepCopy from "./getDeepCopy.js";

export async function findFilesInDb(entities_id = undefined) {
  try {
    if (!entities_id) return [];
    let files = await db.File.findAll({
      where: {
        entities_id,
      },
    });
    files = getDeepCopy(files);
    return files;
  } catch (error) {
    console.log(`Error finding files in db: ${error}`);
    return [];
  }
}

export async function deleteFileInDb(imagesId) {
  try {
    if (!imagesId || !imagesId.length) return true;
    await db.File.destroy({
      where: {
        id: imagesId,
      },
    });
    return true;
  } catch (error) {
    console.log(`Error deleting file in db ${error}`);
    console.log(error);
    return false;
  }
}

export async function insertFilesInDB({
  files,
  entities_id = null,
  entity_types_id = null,
}) {
  try {
    if (!files || !files.length) return true;
    const filesWithIds = files.map((file) => ({
      ...file,
      entities_id: entities_id || null,
      entity_types_id: entity_types_id || null,
    }));
    await db.File.bulkCreate(filesWithIds, {
      updateOnDuplicate: ["main_file", "file_roles_id","position"],
    });
    return true;
  } catch (error) {
    console.log(`Error inserting files in db: ${error}`);
    console.log(error);
    return false;
  }
}
