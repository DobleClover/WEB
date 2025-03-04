export default (sequelize, dataTypes) => {

    let alias = "Variation";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false
        },
        products_id: { type: dataTypes.STRING(36) },
        sizes_id: { type: dataTypes.INTEGER },
        colors_id: { type: dataTypes.STRING(36) },
        quantity: { type: dataTypes.INTEGER },
    }

    let config = {
        tableName: 'variations',
        timestamps: false
    }

    const Variation = sequelize.define(alias, cols, config);

    Variation.associate = (models) => {
        const { Product, OrderItem} = models;
        Variation.belongsTo(Product, {
            as: 'product',
            foreignKey: 'products_id'
        })
        Variation.hasMany(OrderItem, {
            as: 'orderItems',
            foreignKey: 'variations_id'
        })
    };

    return Variation;
}