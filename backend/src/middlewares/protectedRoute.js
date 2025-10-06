import jwt from "jsonwebtoken";

const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    const verifyToken = await jwt.verify(token, process.env.JWT_SECRET);

    if (!verifyToken) {
      return res.status(401).json({
        message: "Invalid Tokens",
        success: false,
      });
    }

    // Set both req.id and req.user for compatibility
    req.id = verifyToken.userId;
    req.user = { _id: verifyToken.userId };
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server errro",
      success: false,
    });
  }
};

export default protectedRoute;
