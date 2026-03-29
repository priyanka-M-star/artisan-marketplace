const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName:        { type: String, required: true },
  description:     { type: String },
  isApproved:      { type: Boolean, default: false },
  stripeAccountId: { type: String },
  stripeOnboarded: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);