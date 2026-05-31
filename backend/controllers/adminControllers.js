// controllers/admin.controller.js
import jwt from "jsonwebtoken";
import Booking from "../models/bookingModels.js";
import Worker from "../models/workerModels.js";
import User from "../models/authModels.js";

export const adminLogin = (req, res) => {
  const { email, password } = req.body;

  // check with env
  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials",
    });
  }

  // token generate
  const token = jwt.sign(
    { role: "admin" }, // 👈 admin role
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // cookie set
  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // production me true
   secure: true,
  sameSite: "None",
  });

  res.json({
    success: true,
    token,
    message: "Admin login successful",
  });
};





export const getAllWorkers = async (req, res) => {
  try {
    // ✅ Sirf workers
    const workers = await User.find({ role: "worker" }).select("-password");

    // ✅ Worker extra data join karo with complete details
    const workerDetails = await Promise.all(
      workers.map(async (user) => {
        const worker = await Worker.findOne({ userId: user._id });
        
        // ✅ Sirf COMPLETED bookings ke liye variables
        let allBookings = [];
        let completedBookings = [];
         let completedJobs = 0;   
        let totalEarnings = 0;
        let totalCommission = 0;
        let currentBookings = 0;
        let totalJobs = 0;
        let rejectedJobs = 0;
        let pendingJobs = 0;
        
        if (worker) {
          try {
            // Saari bookings fetch karo
            allBookings = await Booking.find({ workerId: worker._id });
            
            // ✅ Sirf COMPLETED bookings filter karo
            completedBookings = allBookings.filter(b => b.bookingStatus === "completed");
            
            // ✅ Sirf COMPLETED bookings ka earnings aur commission
            totalEarnings = completedBookings.reduce((sum, b) => sum + (b.workerAmount || b.workerEarnings || 0), 0);
            totalCommission = completedBookings.reduce((sum, b) => sum + (b.adminCommission || 0), 0);
            
            // ✅ Other stats (sab bookings ke liye)
            totalJobs = allBookings.length;
            completedJobs = completedBookings.length;
            rejectedJobs = allBookings.filter(b => b.bookingStatus === "rejected" || b.bookingStatus === "cancelled").length;
            pendingJobs = allBookings.filter(b => b.bookingStatus === "pending").length;
            currentBookings = allBookings.filter(b => 
              b.bookingStatus === "pending" || b.bookingStatus === "accepted"
            ).length;
            
          } catch (error) {
            console.log("Booking model may not exist yet:", error.message);
          }
        }

        return {
          // User basic info
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A',
          role: user.role,
          createdAt: user.createdAt,
          profileImage: user.profileImage || null,
          
          // Complete worker info based on your schema
          workerInfo: worker ? {
            // Basic details
            workerId: worker._id,
            userId: worker.userId,
            
            // Service details
            service: worker.service || 'Not specified',
            price: worker.price || 0,
            
            // Ratings
            rating: worker.rating || 0,
            
            // Location
            location: worker.location || { lat: null, lng: null },
            
            // Availability
            isAvailable: worker.isAvailable !== undefined ? worker.isAvailable : true,
            
            // Timestamps
            createdAt: worker.createdAt,
            updatedAt: worker.updatedAt,
            
            // ✅ Booking Stats (Sirf COMPLETED ka earnings aur commission)
            stats: {
              totalJobs: totalJobs,
              completedJobs: completedJobs,
              rejectedJobs: rejectedJobs,
              pendingJobs: pendingJobs,
              currentBookings: currentBookings,
              totalEarnings: totalEarnings,        // 👈 Sirf completed ka
              totalCommission: totalCommission     // 👈 Sirf completed ka
            }
          } : {
            // If worker profile doesn't exist
            service: 'Not created yet',
            price: 0,
            rating: 0,
            isAvailable: false,
            location: { lat: null, lng: null },
            stats: {
              totalJobs: 0,
              completedJobs: 0,
              rejectedJobs: 0,
              pendingJobs: 0,
              currentBookings: 0,
              totalEarnings: 0,
              totalCommission: 0
            }
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: workerDetails.length,
      workers: workerDetails
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




export const getAdminCommission = async (req, res) => {
  try {
    // ✅ Sirf accepted bookings lo
    const bookings = await Booking.find({
      bookingStatus: "completed"
    }).populate('userId', 'name email') // Optional: user details bhi chahiye to
      .sort({ createdAt: -1 }); // Latest bookings pehle

    // ✅ Total commission calculate
    const totalCommission = bookings.reduce(
      (sum, booking) => sum + (booking.adminCommission || 0), // ✅ Added fallback
      0
    );

    // ✅ Optional: Monthly breakdown
    const monthlyData = {};
    bookings.forEach(booking => {
      const month = booking.createdAt.toISOString().slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + (booking.adminCommission || 0);
    });

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      totalCommission,
      monthlyBreakdown: monthlyData,
      bookings
    });

  } catch (error) {
    console.error("Admin commission error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};