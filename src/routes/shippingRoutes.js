const express        = require('express');
const ShippingProfile = require('../models/ShippingProfile');
const { protect, roleGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, roleGuard('vendor'), async (req, res) => {
  try {
    const profile = await ShippingProfile.findOne({ vendor: req.user._id });
    res.json({ success: true, data: profile });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, roleGuard('vendor'), async (req, res) => {
  try {
    const profile = await ShippingProfile.findOneAndUpdate(
      { vendor: req.user._id },
      { ...req.body, vendor: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;