const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// protect — checks if user is logged in
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// roleGuard — only allows certain roles
// usage: roleGuard('admin') or roleGuard('vendor','admin')
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { protect, roleGuard };
