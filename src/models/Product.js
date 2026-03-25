const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, required: true, default: 0 },
  images:      [{ type: String }],
  category:    { type: String, required: true },
  tags:        [{ type: String }],
  isActive:    { type: Boolean, default: true },
  ratings: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 }
  }
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);