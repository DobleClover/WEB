export default (sequelize, dataTypes) => {
  let alias = "Drop";

  let cols = {
    id: {
      type: dataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    name: { type: dataTypes.STRING(60) },
    active: { type: dataTypes.BOOLEAN },
    unique: { type: dataTypes.BOOLEAN } //TODO: agregar imagenes tanto de card como de fondo
  };

  let config = {
    tableName: "drops",
    paranoid: true,
  };

  const Drop = sequelize.define(alias, cols, config);

  Drop.associate = (models) => {
    Drop.belongsToMany(models.Product, {
        as: 'products',
        through: 'Product_Drop',
        foreignKey: 'drops_id',
        otherKey: "products_id"
    });
  };

  return Drop;
};
