const mongoose = require('mongoose');

const shippingProfileSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  zones: [{
    name:          { type: String, required: true },
    states:        [{ type: String }],
    rate:          { type: Number, required: true },
    estimatedDays: { type: Number, default: 5 }
  }],
  freeShippingAbove: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ShippingProfile', shippingProfileSchema);