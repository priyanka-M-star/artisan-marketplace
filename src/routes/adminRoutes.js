const express                        = require('express');
const { getAllUsers, approveVendor } = require('../controllers/userController');
const { protect, roleGuard }        = require('../middleware/authMiddleware');

const router = express.Router();

router.get   ('/users',               protect, roleGuard('admin'), getAllUsers);
router.patch ('/vendors/:id/approve', protect, roleGuard('admin'), approveVendor);

module.exports = router;