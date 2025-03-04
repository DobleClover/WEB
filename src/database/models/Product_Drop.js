export default (sequelize,dataTypes)=>{
    const alias = 'Product_Drop';

    const cols = {
        id: {
            type: dataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        drops_id: {
            type: dataTypes.STRING(36)
        },
        products_id: {
            type: dataTypes.STRING(36)
        }
    };

    const config = {
        tableName: 'products_drops',
        timestamps: false
    };

    const Product_Drop = sequelize.define(alias,cols,config);

    return Product_Drop;
}   