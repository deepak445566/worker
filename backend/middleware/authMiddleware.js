import jwt from "jsonwebtoken";


export const protect = (...roles) => {
  return (req, res, next) => {
    // 1️⃣ Pehle cookie se try karo
    let token = req.cookies?.token;

    // 2️⃣ Cookie nahi hai to Authorization header se lo
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role }

      // Role check (optional)
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - Access denied",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }
  };
};







export const protectAdmin = (req, res, next) => {
  let token = req.cookies?.token;  // ✅ Changed to 'let'
  
  // If no token in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];  // ✅ Now this works
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Role check
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied - Admin only",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};