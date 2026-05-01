const Category = require("../models/categoryModel");

/* =========================================================
   ➕ ADD CATEGORY (user-specific)
========================================================= */
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // ❗ Prevent duplicate category name under same user
    const existing = await Category.findOne({
      where: { name, userId: req.user.id },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Category already exists" });
    }

    // Create category linked to logged-in user
    const category = await Category.create({
      name,
      description,
      userId: req.user.id,
    });

    res.status(201).json({
      message: "✅ Category added successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to add category",
      error: error.message,
    });
  }
};

/* =========================================================
   📋 GET ALL CATEGORIES (user-specific)
========================================================= */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch categories",
      error: error.message,
    });
  }
};

/* =========================================================
   ✏️ UPDATE CATEGORY (user-specific)
========================================================= */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findOne({
      where: { id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update only provided fields
    await category.update({
      name: name ?? category.name,
      description: description ?? category.description,
    });

    res.json({
      message: "✅ Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to update category",
      error: error.message,
    });
  }
};

/* =========================================================
   ❌ DELETE CATEGORY (user-specific)
========================================================= */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();

    res.json({
      message: "🗑️ Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to delete category",
      error: error.message,
    });
  }
};
