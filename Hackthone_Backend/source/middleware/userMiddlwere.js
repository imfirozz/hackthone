const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
  try {
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

    const result = await User.findById(_id);
    if (!result) {
      return res.status(404).send("user not found");
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
      return res.status(401).send("invalid token");
    }

    req.result = result;
    next();
  } catch (err) {
    res.status(500).send(err.message || "authentication failed");
  }
};

module.exports = userMiddleware;
