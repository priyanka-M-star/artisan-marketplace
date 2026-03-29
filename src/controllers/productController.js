const Product             = require('../models/Product');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.buffer))
      );
    }

    const product = await Product.create({
      title, description, price, category, stock,
      images,
      vendor: req.user._id
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).populate('vendor', 'name email').sort(sort).skip(skip).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.vendor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your product' });
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.vendor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your product' });
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };