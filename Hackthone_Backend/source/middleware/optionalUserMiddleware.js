const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const redisClient = require("../config/redis");

const optionalUserMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      const cookies = req.cookies || {};
      token = cookies.token || "";
    }

    if (!token) {
      return next();
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (error) {
      return next();
    }

    if (!payload?._id) {
      return next();
    }

    let isBlocked = 0;

    if (redisClient?.isOpen) {
      try {
        isBlocked = await redisClient.exists(`token:${token}`);
      } catch (_error) {
        isBlocked = 0;
      }
    }

    if (isBlocked) {
      return next();
    }

    const result = await User.findById(payload._id);
    if (result) {
      req.result = result;
    }

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = optionalUserMiddleware;
