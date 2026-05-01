const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    customerName: { type: DataTypes.STRING, allowNull: false },
    contactInfo: { type: DataTypes.STRING },
    paymentMode: { type: DataTypes.STRING },

    paymentStatus: {
      type: DataTypes.ENUM("Paid", "Partial", "Unpaid"),
      defaultValue: "Unpaid",
    },

    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
      defaultValue: "pending",
    },

    totalPrice: { type: DataTypes.FLOAT, defaultValue: 0 },

    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    timestamps: true,
  }
);

module.exports = Order;
