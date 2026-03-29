const express                                        = require('express');
const { getMyVendorProfile, updateMyVendorProfile }  = require('../controllers/userController');
const { protect, roleGuard }                         = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, roleGuard('vendor'), getMyVendorProfile);
router.put('/me', protect, roleGuard('vendor'), updateMyVendorProfile);

module.exports = router;