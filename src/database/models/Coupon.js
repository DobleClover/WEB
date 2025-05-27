import entityTypes from "../../utils/staticDB/entityTypes.js";

export default (sequelize, dataTypes) => {
  let alias = "Coupon";

  let cols = {
    id: {
      type: dataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    code: {
      type: dataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    discount_percent: {
      type: dataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    expires_at: {
      type: dataTypes.DATE,
      allowNull: true,
    },
    usage_limit: {
      type: dataTypes.INTEGER,
      allowNull: true,
    },
    usage_count: {
      type: dataTypes.INTEGER,
      defaultValue: 0,
    },
    is_first_purchase_only: {
      type: dataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_by_admin: {
      type: dataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  let config = {
    tableName: "coupons",
    paranoid: true,
  };

  const Coupon = sequelize.define(alias, cols, config);

  Coupon.associate = (models) => {
    Coupon.hasMany(models.CouponUsage, {
      as: "usages",
      foreignKey: "coupons_id",
    });
    Coupon.hasOne(models.Order, {
      foreignKey: "coupons_id",
      as: "order",
    });
  };

  return Coupon;
};
