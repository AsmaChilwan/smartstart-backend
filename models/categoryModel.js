// backend/models/categoryModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./userModel");

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },
});

Category.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Category, { foreignKey: "userId", onDelete: "CASCADE" });

module.exports = Category;
