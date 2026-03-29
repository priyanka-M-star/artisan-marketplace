const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  images: [{ type: String }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['jewellery', 'clothing', 'art', 'home-decor', 'food', 'other']
  },
  stock: {
    type: Number,
    default: 1,
    min: 0
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);