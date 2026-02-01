import jwt from "jsonwebtoken";
import User from "../model/User.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Token invalidated" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account disabled" });
    }

    req.user = {
      _id: user._id,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export default protect;
