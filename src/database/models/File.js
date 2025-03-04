export default (sequelize, dataTypes) => {

    let alias = "File";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        filename: { type: dataTypes.STRING(255) },
        products_id: { type: dataTypes.STRING(36) },
        file_types_id: { type: dataTypes.INTEGER },
        sections_id: { type: dataTypes.INTEGER },
        main_file: { type: dataTypes.TINYINT },
    }

    let config = {
        tableName: 'files',
        timestamps: false
    }

    const File = sequelize.define(alias, cols, config);

    File.associate = (models) => {
        const {Product} = models;
        File.belongsTo(Product, {
            as: 'product',
            foreignKey: 'product_id'
        })
    };

    return File;
}