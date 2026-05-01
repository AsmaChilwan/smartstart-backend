const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (excluding password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!req.user)
        return res.status(404).json({ message: "User not found" });

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });
};

module.exports = protect;
