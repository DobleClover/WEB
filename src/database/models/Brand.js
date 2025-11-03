import entityTypes from "../../utils/staticDB/entityTypes.js";

export default (sequelize, dataTypes) => {

    let alias = "Brand";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        name: { type: dataTypes.STRING(60) },
        show_in_home: { type: dataTypes.BOOLEAN },
    }

    let config = {
        tableName: 'brands',
        paranoid: true
    }

    const Brand = sequelize.define(alias, cols, config);

    Brand.associate = (models) => {
        Brand.hasMany(models.Product, {
            as: 'products',
            foreignKey: 'brands_id'
        })
        Brand.hasMany(models.File, {
            as: "files",
            foreignKey: "entities_id",
            constraints: false, // Sequelize NO agregará una restricción de clave foránea
            scope: { entity_types_id: entityTypes.BRAND }, //Solo busca los files que sea = a brand
          });
    };

    return Brand;
}