const express = require('express');
const {
  onboardVendor,
  getConnectStatus,
  checkout,
  stripeWebhook,
  confirmPayment
} = require('../controllers/paymentController');
const { protect, roleGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/connect/onboard', protect, roleGuard('vendor'), onboardVendor);
router.get ('/connect/status',  protect, roleGuard('vendor'), getConnectStatus);
router.post('/checkout', protect, roleGuard('buyer'), checkout);
router.post('/confirm', protect, roleGuard('buyer'), confirmPayment);

module.exports = router;