import entityTypes from "../../utils/staticDB/entityTypes.js";

export default (sequelize, dataTypes) => {

    let alias = "StockAlert";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        products_id: { type: dataTypes.STRING(36) },
        sizes_id: { type: dataTypes.INTEGER },
        email : { type: dataTypes.STRING(255) },
        notified : { type: dataTypes.BOOLEAN },
        phone_number: { type: dataTypes.STRING(70) },
        phone_countries_id: { type: dataTypes.INTEGER },
    }

    let config = {
        tableName: 'stock_alerts',
        paranoid: true
    }

    const StockAlert = sequelize.define(alias, cols, config);

    StockAlert.associate = (models) => {
        StockAlert.belongsTo(models.Product, {
            as: 'product',
            foreignKey: 'products_id'
        })
    };

    return StockAlert;
}