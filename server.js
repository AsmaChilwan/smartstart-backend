require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// 🧩 Import models (ONLY fields, NOT associations)
const User = require('./models/userModel');
const Category = require('./models/categoryModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const OrderItem = require('./models/orderItemModel');
const Expense = require('./models/expenseModel');

/* ============================================================
   🔗 DEFINE ALL ASSOCIATIONS IN ONE PLACE
   (prevents duplicate FK creation & “too many keys” crash)
============================================================= */

// 🟦 USER → MANY
User.hasMany(Category, { foreignKey: "userId", onDelete: "CASCADE" });
Category.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Product, { foreignKey: "userId", onDelete: "CASCADE" });
Product.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE" });
Expense.belongsTo(User, { foreignKey: "userId" });

User.hasMany(OrderItem, { foreignKey: "userId", onDelete: "CASCADE" });
OrderItem.belongsTo(User, { foreignKey: "userId" });

// 🟨 CATEGORY → PRODUCT
Category.hasMany(Product, { foreignKey: "categoryId", onDelete: "SET NULL" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

// 🟥 ORDER → ORDER ITEMS
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// 🟧 PRODUCT → ORDER ITEMS
Product.hasMany(OrderItem, { foreignKey: "productId", onDelete: "CASCADE" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

/* ============================================================
   🧭 ROUTES
============================================================= */
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();


app.set('trust proxy', 1); 

// 🌐 Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// Root
app.get('/', (req, res) => {
  res.send('🚀 SmartStart API Running Successfully ✅');
});

// 🧭 Use Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Unexpected error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ⬆️ Start server + Sync DB
(async () => {
  try {
    console.log('⏳ Connecting to MySQL...');

    // 🛑 VERY IMPORTANT FIX → remove ALTER (causes schema corruption)
    await sequelize.sync();

    console.log('✅ Connected to MySQL and synced all models.');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Reports available at: /api/reports`);
});


  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();
