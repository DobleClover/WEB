export default (sequelize, dataTypes) => {

    let alias = "Phone";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        phone_number: { type: dataTypes.STRING(70) },
        countries_id: { type: dataTypes.STRING(36) },
        users_id: { type: dataTypes.STRING(36) },
        default: { type: dataTypes.BOOLEAN },
    }

    let config = {
        tableName: 'phones',
        paranoid: true,
    }

    const Phone = sequelize.define(alias, cols, config);

    Phone.associate = (models) => {
        const {User} = models;
        Phone.belongsTo(User, {
            as: 'user',
            foreignKey: 'users_id'
        })
    };

    return Phone;
}