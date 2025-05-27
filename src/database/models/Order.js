export default (sequelize, dataTypes) => {
  let alias = "Order";

  let cols = {
    id: {
      type: dataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    tra_id: { type: dataTypes.STRING(15) },
    users_id: { type: dataTypes.STRING(36) },
    coupons_id: { type: dataTypes.STRING(36) },
    first_name: { type: dataTypes.STRING(150) },
    last_name: { type: dataTypes.STRING(150) },
    email: { type: dataTypes.STRING(150) },
    dni: { type: dataTypes.STRING(40) },
    total: { type: dataTypes.DECIMAL(10, 2) },
    order_statuses_id: { type: dataTypes.INTEGER },
    shipping_types_id: { type: dataTypes.INTEGER },
    payment_types_id: { type: dataTypes.INTEGER },
    entity_payments_id: { type: dataTypes.STRING(100) },
    //Billing Address Snapshot
    billing_address_street: { type: dataTypes.STRING(200) },
    billing_address_detail: { type: dataTypes.STRING(200) },
    billing_address_city: { type: dataTypes.STRING(200) },
    billing_address_province: { type: dataTypes.STRING(200) },
    billing_address_zip_code: { type: dataTypes.STRING(200) },
    billing_address_label: { type: dataTypes.STRING(200) },
    //Shipping Address Snapshot
    shipping_address_street: { type: dataTypes.STRING(200) },
    shipping_address_detail: { type: dataTypes.STRING(200) },
    shipping_address_city: { type: dataTypes.STRING(200) },
    shipping_address_province: { type: dataTypes.STRING(200) },
    shipping_address_zip_code: { type: dataTypes.STRING(200) },
    shipping_address_label: { type: dataTypes.STRING(200) },
    //Phone Snapshot
    phone_code: { type: dataTypes.STRING(50) },
    phone_number: { type: dataTypes.STRING(100) },
  };

  let config = {
    tableName: "orders",
    paranoid: true,
  };

  const Order = sequelize.define(alias, cols, config);

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      as: "user",
      foreignKey: "users_id",
    });
    Order.hasMany(models.OrderItem, {
      as: "orderItems",
      foreignKey: "orders_id",
    });
    Order.belongsTo(models.Coupon, {
      foreignKey: "coupons_id",
      as: "coupon",
    });
  };

  return Order;
};
