export default (sequelize, dataTypes) => {

    let alias = "Tag";

    let cols = {
        id: {
            type: dataTypes.STRING(36),
            primaryKey: true,
            allowNull: false,
        },
        name: { type: dataTypes.STRING(60) },
        logo_filename: { type: dataTypes.STRING(100) },
    }

    let config = {
        tableName: 'tags',
        paranoid: true
    }

    const Tag = sequelize.define(alias, cols, config);

    Tag.associate = (models) => {
        Tag.hasMany(models.Product, {
            as: 'products',
            foreignKey: 'tags_id'
        })
    };

    return Tag;
}