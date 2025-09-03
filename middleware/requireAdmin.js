const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies?.admintoken || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || "devsecret");
    req.admin = payload; // { username }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
