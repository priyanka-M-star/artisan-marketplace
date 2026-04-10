const mongoose = require('mongoose');
const Order    = require('../models/Order');
const Product  = require('../models/Product');

const placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, shippingCost } = req.body;
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(item.product)
      });
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.title}` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({
        product:  product._id,
        quantity: item.quantity,
        price:    product.price,
        vendor:   product.vendor
      });
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }
    const order = await Order.create({
      buyer: req.user._id, items: orderItems, shippingAddress,
      totalAmount: totalAmount + (shippingCost || 0), shippingCost: shippingCost || 0
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).populate('items.product', 'title images price').sort('-createdAt');
    res.json({ success: true, data: orders });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.vendor': req.user._id }).populate('buyer', 'name email').populate('items.product', 'title price').sort('-createdAt');
    res.json({ success: true, data: orders });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'name email').populate('items.product', 'title images price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check if buyer owns this order
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { placeOrder, getMyOrders, getVendorOrders, updateOrderStatus, getOrderById, cancelOrder };