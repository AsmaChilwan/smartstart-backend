const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const OrderItem = require("../models/orderItemModel");
const sequelize = require("../config/db");
const { Op } = require("sequelize");

/* ============================================================
   ➕ CREATE ORDER
============================================================ */
exports.addOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      paymentMode,
      paymentStatus,
      status,
      items,
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "❌ No items provided" });

    const order = await Order.create(
      {
        userId: req.user.id,
        customerName,
        contactInfo: `${customerPhone || ""} ${customerEmail || ""}`.trim(),
        paymentMode,
        paymentStatus: paymentStatus || "Unpaid",
        status: status || "pending",
        totalPrice: 0,
      },
      { transaction: t }
    );

    let total = 0;

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, userId: req.user.id },
        transaction: t,
      });

      if (!product)
        throw new Error(`Product ID ${item.productId} not found or not yours`);

      if (product.quantity < item.quantity && status === "completed")
        throw new Error(`Not enough stock for product: ${product.name}`);

      const subtotal = product.price * item.quantity;
      total += subtotal;

      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          userId: req.user.id,
          quantity: item.quantity,
          price: product.price,
          subtotal,
        },
        { transaction: t }
      );

      // Reduce stock only if order is completed
      if (status === "completed") {
        product.quantity -= item.quantity;
        await product.save({ transaction: t });
      }
    }

    if (order.status === "completed") order.paymentStatus = "Paid";
    if (order.status === "cancelled") order.paymentStatus = "Unpaid";

    order.totalPrice = total;
    await order.save({ transaction: t });

    await t.commit();
    res.json({ message: "✅ Order created", order });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "❌ Failed to create order",
      error: error.message,
    });
  }
};

/* ============================================================
   📋 GET ALL ORDERS
============================================================ */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          required: false,
          include: [
            {
              model: Product,
              where: { userId: req.user.id },
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch orders",
      error: error.message,
    });
  }
};

/* ============================================================
   ✏️ EDIT ORDER
============================================================ */
exports.editOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      paymentMode,
      status,
      paymentStatus,
      items,
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items provided" });

    const order = await Order.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: OrderItem, include: [Product] }],
      transaction: t,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Restore old stock only if previous order was completed
    if (order.status === "completed") {
      for (const oldItem of order.OrderItems) {
        const p = await Product.findOne({
          where: { id: oldItem.productId, userId: req.user.id },
          transaction: t,
        });
        if (p) {
          p.quantity += oldItem.quantity;
          await p.save({ transaction: t });
        }
      }
    }

    await OrderItem.destroy({ where: { orderId: id }, transaction: t });

    let newTotal = 0;

    for (const item of items) {
      const p = await Product.findOne({
        where: { id: item.productId, userId: req.user.id },
        transaction: t,
      });

      if (!p) throw new Error("Product not found");

      if (p.quantity < item.quantity && status === "completed")
        throw new Error(`Not enough stock for ${p.name}`);

      const subtotal = p.price * item.quantity;
      newTotal += subtotal;

      await OrderItem.create(
        {
          orderId: id,
          userId: req.user.id,
          productId: item.productId,
          quantity: item.quantity,
          price: p.price,
          subtotal,
        },
        { transaction: t }
      );

      // Reduce stock only if new status is completed
      if (status === "completed") {
        p.quantity -= item.quantity;
        await p.save({ transaction: t });
      }
    }

    order.customerName = customerName;
    order.contactInfo = `${customerPhone || ""} ${customerEmail || ""}`.trim();
    order.paymentMode = paymentMode;
    order.status = status;
    order.paymentStatus = paymentStatus;
    order.totalPrice = newTotal;

    if (status === "completed") order.paymentStatus = "Paid";
    if (status === "cancelled") order.paymentStatus = "Unpaid";

    await order.save({ transaction: t });
    await t.commit();

    res.json({ message: "✅ Order updated", order });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

/* ============================================================
   🔄 UPDATE ORDER STATUS
============================================================ */
exports.updateOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: OrderItem, include: [Product] }],
      transaction: t,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const oldStatus = order.status;
    order.status = status || order.status;
    order.paymentStatus = paymentStatus || order.paymentStatus;

    // Reduce stock only if changing to completed
    if (oldStatus !== "completed" && status === "completed") {
      for (const item of order.OrderItems) {
        if (item.Product) {
          if (item.Product.quantity < item.quantity)
            throw new Error(`Not enough stock for ${item.Product.name}`);
          item.Product.quantity -= item.quantity;
          await item.Product.save({ transaction: t });
        }
      }
      order.paymentStatus = "Paid";
    }

    // Restore stock if order is cancelled
    if (status === "cancelled") {
      for (const item of order.OrderItems) {
        if (item.Product) {
          item.Product.quantity += item.quantity;
          await item.Product.save({ transaction: t });
        }
      }
      order.paymentStatus = "Unpaid";
    }

    await order.save({ transaction: t });
    await t.commit();

    res.json({ message: "✅ Order status updated", order });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "❌ Failed to update order status",
      error: error.message,
    });
  }
};

/* ============================================================
   CANCEL ORDER
============================================================ */
exports.cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: OrderItem, include: [Product] }],
      transaction: t,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "completed") {
      for (const item of order.OrderItems) {
        if (item.Product) {
          item.Product.quantity += item.quantity;
          await item.Product.save({ transaction: t });
        }
      }
    }

    order.status = "cancelled";
    order.paymentStatus = "Unpaid";
    await order.save({ transaction: t });

    await t.commit();
    res.json({ message: "🚫 Order cancelled successfully", order });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "❌ Failed to cancel order",
      error: error.message,
    });
  }
};

/* ============================================================
   🔍 SEARCH ORDERS
============================================================ */
exports.searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    const orders = await Order.findAll({
      where: {
        userId: req.user.id,
        customerName: { [Op.like]: `%${q}%` },
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              where: {
                userId: req.user.id,
                name: { [Op.like]: `%${q}%` },
              },
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};

/* ============================================================
   📈 SALES BY PRODUCT
============================================================ */
exports.getSalesByProduct = async (req, res) => {
  try {
    const sales = await OrderItem.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          required: false,
        },
      ],
    });

    const totals = {};

    for (const item of sales) {
      const productName = item.Product ? item.Product.name : "Unknown";

      if (!totals[productName]) {
        totals[productName] = {
          productName,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }

      totals[productName].totalQuantity += item.quantity;
      totals[productName].totalRevenue += item.subtotal;
    }

    res.json({
      success: true,
      sales: Object.values(totals),
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to load sales by product",
      error: error.message,
    });
  }
};

/* ============================================================
   📊 ORDER SUMMARY
============================================================ */
exports.getOrderSummary = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          include: [Product],
          required: false,
        },
      ],
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === "completed").length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

    const totalRevenue = orders
      .filter(o => o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const productSales = {};
    for (const order of orders) {
      for (const item of order.OrderItems) {
        const name = item.Product?.name;
        if (!name) continue;
        if (!productSales[name]) productSales[name] = 0;
        productSales[name] += item.quantity;
      }
    }

    let bestProduct = "No data";
    if (Object.keys(productSales).length > 0) {
      bestProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0][0];
    }

    res.json({
      message: "📊 Summary loaded successfully",
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue,
      bestProduct,
    });

  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to get summary",
      error: error.message,
    });
  }
};

/* ============================================================
   ✅ EXPORTS
============================================================ */
module.exports = {
  addOrder: exports.addOrder,
  getAllOrders: exports.getAllOrders,
  editOrder: exports.editOrder,
  updateOrderStatus: exports.updateOrderStatus,
  cancelOrder: exports.cancelOrder,
  getOrderSummary: exports.getOrderSummary,
  getSalesByProduct: exports.getSalesByProduct,
  searchOrders: exports.searchOrders,
};
