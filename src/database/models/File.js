export default (sequelize, dataTypes) => {

    let alias = "File";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        filename: { type: dataTypes.STRING(255) },
        entities_id: { type: dataTypes.STRING(36) }, //el id ya sea producto, marca o drop
        entity_types_id: { type: dataTypes.INTEGER }, //tipo de entidad que almacene
        file_types_id: { type: dataTypes.INTEGER },
        sections_id: { type: dataTypes.INTEGER },
        file_roles_id: { type: dataTypes.INTEGER },
        main_file: { type: dataTypes.TINYINT },
    }

    let config = {
        tableName: 'files',
        timestamps: false
    }

    const File = sequelize.define(alias, cols, config);

    return File;
}