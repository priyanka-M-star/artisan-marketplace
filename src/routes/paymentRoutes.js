const express = require('express');
const {
  onboardVendor,
  getConnectStatus,
  checkout,
  stripeWebhook
} = require('../controllers/paymentController');
const { protect, roleGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/connect/onboard', protect, roleGuard('vendor'), onboardVendor);
router.get ('/connect/status',  protect, roleGuard('vendor'), getConnectStatus);
router.post('/checkout', protect, roleGuard('buyer'), checkout);

module.exports = router;