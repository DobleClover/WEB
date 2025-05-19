import entityTypes from "../../utils/staticDB/entityTypes.js";

export default (sequelize, dataTypes) => {
  let alias = "Product";

  let cols = {
    id: {
      type: dataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    name: { type: dataTypes.STRING(255) },
    active: { type: dataTypes.BOOLEAN },
    description: { type: dataTypes.TEXT },
    price: { type: dataTypes.DECIMAL(10, 2) },
    categories_id: { type: dataTypes.INTEGER },
    discount: { type: dataTypes.INTEGER },
    brands_id: { type: dataTypes.STRING(36) },
    is_dobleuso: {
      type: dataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  };

  let config = {
    tableName: "products",
    paranoid: true,
  };

  const Product = sequelize.define(alias, cols, config);

  Product.associate = (models) => {
    const { File, Variation, Brand, Drop, StockAlert } = models;
    Product.hasMany(File, {
      as: "files",
      foreignKey: "entities_id",
      constraints: false, // Sequelize NO agregará una restricción de clave foránea
      scope: { entity_types_id: entityTypes.PRODUCT }, //Solo busca los files que sea 1
    });
    Product.hasMany(Variation, {
      as: "variations",
      foreignKey: "products_id",
    });
    Product.belongsToMany(Drop, {
      as: "drops",
      through: "Product_Drop",
      foreignKey: "products_id",
      otherKey: "drops_id",
    });
    Product.belongsTo(Brand, {
      as: "brand",
      foreignKey: "brands_id",
    });
    Product.hasMany(StockAlert, {
      as: "stockAlerts",
      foreignKey: "products_id",
    });
  };

  return Product;
};
