const {json} = require('body-parser');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes (user authentication)
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: 'Not authorized' });

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token); //Check token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    if(!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    console.log('JWT verification error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Authorization (specific roles)
exports.authorize = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (user.role !== 'organization') {
    return res.status(403).json({ message: 'For Organization only' });
  }
  next();
};
