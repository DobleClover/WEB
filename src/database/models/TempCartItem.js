export default (sequelize, dataTypes) => {

    let alias = "TempCartItem";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        variations_id: { type: dataTypes.STRING(36) },
        users_id: { type: dataTypes.STRING(36) },
        quantity: { type: dataTypes.INTEGER },
    }

    let config = {
        tableName: 'temp_carts_items',
        timestamps: false,
    }

    const TempCartItem = sequelize.define(alias, cols, config);

    TempCartItem.associate = (models) => {
        const {Variation, User} = models;
        TempCartItem.belongsTo(Variation, {
            as: 'variation',
            foreignKey: 'variations_id'
        })
        TempCartItem.belongsTo(User, {
            as: 'user',
            foreignKey: 'users_id'
        })
    };

    return TempCartItem;
}