export default (sequelize, dataTypes) => {
    let alias = "OrderItem";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true
        },
        orders_id: { type: dataTypes.STRING(36) },
        variations_id: { type: dataTypes.STRING(36) }, //Dejo la variation en vez del producto para poder manejar mejor el stock
        name: {type: dataTypes.STRING(255)},
        price: { type: dataTypes.DECIMAL(10,2) },
        quantity: {type: dataTypes.INTEGER},
        color: {type: dataTypes.STRING(255)},
        size: {type: dataTypes.STRING(20)},
        discount: { type: dataTypes.TINYINT },
    }

    let config = {
        tableName: 'order_items',
        paranoid: true,
    }

    const OrderItem = sequelize.define(alias, cols, config);

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Order, {
            as: 'order',
            foreignKey: 'orders_id'
        });
        OrderItem.belongsTo(models.Variation, {
            as: 'variation',
            foreignKey: 'variations_id'
        });
    };

    return OrderItem;
}