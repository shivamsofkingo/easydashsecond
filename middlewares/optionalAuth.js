const jwt = require('jsonwebtoken');
const User = require('../models/users');

module.exports = async function optionalAuth(req, res, next) {
  try {
    let token;

    // 1) Try Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2) Fallback to cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select('_id');
        if (user) req.user = user;
      }
    }
  } catch (err) {
    // Silently continue as guest user
  }
  next();
};
