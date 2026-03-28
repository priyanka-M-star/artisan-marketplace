const express  = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, roleGuard } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/',    getProducts);
router.get('/:id', getProduct);

router.post('/',
  protect,
  roleGuard('vendor'),
  upload.array('images', 5),
  createProduct
);
router.put   ('/:id', protect, roleGuard('vendor'), updateProduct);
router.delete('/:id', protect, roleGuard('vendor'), deleteProduct);

module.exports = router;