export default (sequelize, dataTypes) => {

    let alias = "Address";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        users_id: { type: dataTypes.STRING(36)},
        street: { type: dataTypes.STRING(255) },
        detail: { type: dataTypes.STRING(60) },
        zip_code: { type: dataTypes.STRING(10) },
        label: {type: dataTypes.STRING(100)},
        city: { type: dataTypes.STRING(100) },
        provinces_id: { type: dataTypes.INTEGER },
        default: { type: dataTypes.BOOLEAN },
    }

    let config = {
        tableName: 'addresses',
        paranoid: true,
    }

    const Address = sequelize.define(alias, cols, config);

    Address.associate = (models) => {
        const {User} = models;
        Address.belongsTo(User, {
            as: 'user',
            foreignKey: 'users_id'
        })
    };

    return Address;
}