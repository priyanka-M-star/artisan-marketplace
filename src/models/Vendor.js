const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName:        { type: String, required: [true, 'Shop name is required'], trim: true },
  description:     { type: String, default: '' },
  logo:            { type: String, default: '' },
  isApproved:      { type: Boolean, default: false },
  stripeAccountId: { type: String, default: '' },
  stripeOnboarded: { type: Boolean, default: false },
  commissionRate:  { type: Number, default: 10 },
  shippingProfiles: [{ zoneName: String, rate: Number, days: String }],
  totalRevenue:    { type: Number, default: 0 },
  totalOrders:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);