import User from "../models/authModels.js";
import Booking from "../models/bookingModels.js";
import Worker from "../models/workerModels.js";

export const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate("userId", "name email");

    return res.json({
      success: true,
      count: workers.length,
      workers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWorkersByService = async (req, res) => {
  try {
    const { service } = req.query;

    // If no service provided, return all workers
    if (!service || service === '') {
      const workers = await Worker.find({})
        .populate("userId", "name email phone");
      
      return res.json({
        success: true,
        count: workers.length,
        workers
      });
    }

    // Case-insensitive partial search
    const workers = await Worker.find({ 
      service: { $regex: service, $options: 'i' } 
    })
    .populate("userId", "name email phone");

    if (workers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        workers: [],
        message: "No workers found for this service"
      });
    }

    return res.json({
      success: true,
      count: workers.length,
      workers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWorkerEarnings = async (req, res) => {
  try {
    // 🔥 userId se worker find karo
    const worker = await Worker.findOne({ userId: req.user.id });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // ✅ ab correct workerId use karo
    const bookings = await Booking.find({
      workerId: worker._id,
      bookingStatus: "accepted"
    });

    const totalEarnings = bookings.reduce(
      (sum, booking) => sum + booking.workerAmount,
      0
    );

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      totalEarnings,
      bookings
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getWorkerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ user find
    const user = await User.findById(userId).select("-password");

    if (!user || user.role !== "worker") {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // ✅ worker data find
    const worker = await Worker.findOne({ userId });

    return res.status(200).json({
      success: true,
      user,
      worker
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getWorkerBookingStats = async (req, res) => {
  try {
    // 🔥 userId → workerId
    const worker = await Worker.findOne({ userId: req.user.id });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // ✅ saari bookings
    const bookings = await Booking.find({ workerId: worker._id });

    // ✅ counts
    const total = bookings.length;

    const pending = bookings.filter(
      (b) => b.bookingStatus === "pending"
    ).length;

    const accepted = bookings.filter(
      (b) => b.bookingStatus === "accepted"
    ).length;

    const completed = bookings.filter(
      (b) => b.bookingStatus === "completed"
    ).length;

    const rejected = bookings.filter(
      (b) => b.bookingStatus === "rejected"
    ).length;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        accepted,
        completed,
        rejected
      },
      bookings
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};