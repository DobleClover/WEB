export default (sequelize, dataTypes) => {

    let alias = "Setting";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        name : { type: dataTypes.STRING(100) },
        value : { type: dataTypes.DECIMAL(10,4) },
        setting_types_id : { type: dataTypes.INTEGER },
    }

    let config = {
        tableName: 'settings',
        timestamps: false
    }

    const Setting = sequelize.define(alias, cols, config);

    return Setting;
}