const express = require('express');
const {
  placeOrder, getMyOrders,
  getVendorOrders, updateOrderStatus, getOrderById, cancelOrder
} = require('../controllers/orderController');
const { protect, roleGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.post ('/',           protect, roleGuard('buyer'),  placeOrder);
router.get  ('/',           protect, roleGuard('buyer'),  getMyOrders);
router.get  ('/:id',        protect,                     getOrderById);
router.get  ('/vendor/all', protect, roleGuard('vendor'), getVendorOrders);
router.patch('/:id/status', protect, roleGuard('vendor'), updateOrderStatus);
router.patch('/:id/cancel', protect, roleGuard('buyer'),  cancelOrder);

module.exports = router;