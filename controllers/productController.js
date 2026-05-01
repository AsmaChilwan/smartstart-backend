const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { Op } = require("sequelize");

// ➕ Add new product (linked to category and user)
exports.addProduct = async (req, res) => {
  try {
    const { name, price, quantity, categoryId } = req.body;

    if (!name || !price || quantity === undefined || !categoryId) {
      return res.status(400).json({
        message: "All fields are required (name, price, quantity, categoryId)",
      });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ✅ attach userId from logged-in user
    const product = await Product.create({
      name,
      price,
      quantity,
      categoryId,
      userId: req.user.id,
    });

    res
      .status(201)
      .json({ message: "✅ Product added successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};

// 📋 Get all products (user-specific + include category info)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { userId: req.user.id }, // ✅ filter by logged-in user
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};

// ✏️ Update product (only if owned by user)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, categoryId } = req.body;

    const product = await Product.findOne({
      where: { id, userId: req.user.id }, // ✅ ensure product belongs to user
    });
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category)
        return res.status(404).json({ message: "Category not found" });
    }

    await product.update({ name, price, quantity, categoryId });
    res.json({ message: "✅ Product updated successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};

// ❌ Delete product (only if owned by user)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, userId: req.user.id }, // ✅ user-based protection
    });
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    await product.destroy();
    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};

// 🔍 Search products by name (user-specific)
exports.searchProducts = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Please provide a search term" });
    }

    const products = await Product.findAll({
      where: {
        userId: req.user.id, // ✅ filter by user
        name: { [Op.like]: `%${name}%` },
      },
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};

// 🏆 Get top-performing products (user-specific, sorted by quantity)
exports.getTopProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { userId: req.user.id }, // ✅ only this user’s products
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["quantity", "DESC"]],
      limit: 5,
    });

    res.json({
      message: "🏆 Top-performing products (by quantity)",
      products,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server error", error: error.message });
  }
};
