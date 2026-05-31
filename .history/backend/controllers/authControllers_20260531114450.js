import User from "../models/authModels.js";
import Worker from "../models/workerModels.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// authControllers.js - Updated registerUser
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      service,
      price,
      location,  // Accept location as string or object
      experience
    } = req.body;

    console.log("📝 Registration request received:", { 
      name, 
      email, 
      role, 
      service, 
      price,
      location: typeof location === 'object' ? JSON.stringify(location) : location 
    });

    // ✅ Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required"
      });
    }

    // ✅ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // ✅ Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ✅ Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: role || "user",
      verified: true
    });

    const savedUser = await newUser.save();
    console.log("✅ User saved:", savedUser._id);

    let workerData = null;

    // ✅ Worker create
    if (role === "worker") {
      // Validate required worker fields
      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service is required for worker"
        });
      }
      
      if (!price) {
        return res.status(400).json({
          success: false,
          message: "Price is required for worker"
        });
      }

      // Handle location - can be string or object
      let locationString = null;
      if (location) {
        if (typeof location === 'string') {
          locationString = location;
        } else if (typeof location === 'object') {
          // Build location string from object
          const parts = [];
          if (location.address) parts.push(location.address);
          if (location.city) parts.push(location.city);
          if (location.state) parts.push(location.state);
          if (location.pincode) parts.push(location.pincode);
          if (location.country && location.country !== 'India') parts.push(location.country);
          locationString = parts.join(', ');
        }
      }

      const newWorker = new Worker({
        userId: savedUser._id,
        service: service,
        price: Number(price),
        location: locationString || null,
        experience: experience ? Number(experience) : 0,
        isAvailable: true,
        rating: 0,
        totalBookings: 0
      });

      workerData = await newWorker.save();
      console.log("✅ Worker saved:", workerData._id);
    }

    // 🔐 Generate JWT TOKEN
    const token = jwt.sign(
      {
        id: savedUser._id,
        role: savedUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    
    });
    
    // ✅ Response
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        verified: savedUser.verified
      },
      worker: workerData,
       token: token
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    console.error("Error stack:", error.stack);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required"
      });
    }

    // ✅ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 🔐 Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Worker data
    let workerData = null;
    if (user.role === "worker") {
      workerData = await Worker.findOne({ userId: user._id });
    }

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true ,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // ✅ Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified
      },
      worker: workerData,
       token: token
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const isAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    let workerData = null;
    if (user.role === "worker") {
      workerData = await Worker.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      message: "User authenticated",
      user,
      worker: workerData
    });

  } catch (err) {
    console.error("isAuth error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};