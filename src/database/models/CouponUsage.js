import entityTypes from "../../utils/staticDB/entityTypes.js";

export default (sequelize, dataTypes) => {
  let alias = "CouponUsage";

  let cols = {
    id: {
      type: dataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    coupons_id: {
      type: dataTypes.STRING(36),
      allowNull: false,
    },
    users_id: {
      type: dataTypes.STRING(36),
      allowNull: false,
    },
    used_at: {
      type: dataTypes.DATE,
      defaultValue: dataTypes.NOW,
    },
  };

  let config = {
    tableName: "coupon_usages",
    timestamps: false,
  };

  const CouponUsage = sequelize.define(alias, cols, config);

  CouponUsage.associate = (models) => {
    CouponUsage.belongsTo(models.User, {
      as: "user",
      foreignKey: "users_id",
    });
    CouponUsage.belongsTo(models.Coupon, {
      as: "coupon",
      foreignKey: "coupons_id",
    });
  };

  return CouponUsage;
};
