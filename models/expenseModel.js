const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel'); // ⭐ Required for multi-user data

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Your fields 👇
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  category: {
    type: DataTypes.STRING, // e.g. "Rent", "Supplies", "Fuel", "Utilities"
    allowNull: true,
  },

  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },

  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ⭐ NEW FIELD — link every expense to a user
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

// ⭐ Relationships
Expense.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE" });

module.exports = Expense;
