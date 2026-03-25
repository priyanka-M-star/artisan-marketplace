const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    quantity: { type: Number, required: true },
    price:    { type: Number, required: true }
  }],
  totalAmount:     { type: Number, required: true },
  shippingCost:    { type: Number, default: 0 },
  platformFee:     { type: Number, default: 0 },
  vendorPayout:    { type: Number, default: 0 },
  status:          { type: String, enum: ['pending','processing','shipped','delivered','cancelled'], default: 'pending' },
  paymentStatus:   { type: String, enum: ['unpaid','paid','refunded'], default: 'unpaid' },
  paymentIntentId: { type: String, default: '' },
  shippingAddress: { street: String, city: String, state: String, pincode: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);