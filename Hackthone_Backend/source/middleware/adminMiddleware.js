const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      return next();
    }

    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      const cookies = req.cookies || {};
      token = cookies.token;
    }

    if (!token) {
      return res.status(401).send("invalid token");
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(401).send("invalid token");
    }

    const { _id } = payload;
    if (!_id) {
      return res.status(401).send("invalid token");
    }

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).send("invalid token");
    }

    const result = await User.findById(_id);
    if (!result) {
      return res.status(404).send("user not found");
    }

    if (payload.role !== "admin" || result.role !== "admin") {
      return res.status(403).send("admin access required");
    }

    req.result = result;
    next();
  } catch (err) {
    res.status(500).send(err.message || "authentication failed");
  }
};

module.exports = adminMiddleware;
