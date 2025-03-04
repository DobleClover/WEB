export default (sequelize, dataTypes) => {

    let alias = "Product";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        name: { type: dataTypes.STRING(255) },
        description: { type: dataTypes.TEXT },
        price: { type: dataTypes.DECIMAL(10,2) },
        categories_id: { type: dataTypes.INTEGER },
        tags_id: { type: dataTypes.STRING(36) },
    }

    let config = {
        tableName: 'products',
        paranoid: true,
    }

    const Product = sequelize.define(alias, cols, config);

    Product.associate = (models) => {
        const {File, Variation, Tag, Drop} = models;
        Product.hasMany(File, {
            as: 'files',
            foreignKey: 'products_id'
        })
        Product.hasMany(Variation, {
            as: 'variations',
            foreignKey: 'products_id'
        })
        Product.belongsToMany(Drop, {
            as: 'drops',
            through: 'Product_Drop',
            foreignKey: "products_id",
            otherKey: 'drops_id',
        });
        Product.hasMany(Tag, {
            as: 'tag',
            foreignKey: 'tags_id'
        })
    };

    return Product;
}