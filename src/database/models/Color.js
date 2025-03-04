export default (sequelize, dataTypes) => {

    let alias = "Color";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        name: { type: dataTypes.STRING(255) },
    }

    let config = {
        tableName: 'colors',
        paranoid: true
    }

    const Color = sequelize.define(alias, cols, config);

    Color.associate = (models) => {
        Color.hasMany(models.Variation, {
            as: 'variations',
            foreignKey: 'colors_id'
        })
    };

    return Color;
}