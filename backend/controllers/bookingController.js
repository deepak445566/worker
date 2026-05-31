import Booking from "../models/bookingModels.js";
import Worker from "../models/workerModels.js";
import { io } from "../server.js";


// 🔥 CREATE BOOKING
// 🔥 CREATE BOOKING (Complete fixed version)
export const createBooking = async (req, res) => {
  try {
    const {
      workerId,
      service,
      date,
      time,
      location,
      totalAmount,
      hours
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!workerId || !service || !date || !time || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    // Get worker details to verify price
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // Verify the total amount matches worker price × hours
    const expectedAmount = (worker.price || 0) * (hours || 1);
    if (Math.abs(totalAmount - expectedAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount calculation"
      });
    }

    // Calculate commission (10% of totalAmount)
    const adminCommission = totalAmount * 0.1;
    const workerAmount = totalAmount * 0.9;

    // Create booking
    const booking = await Booking.create({
      userId,
      workerId,
      service,
      date,
      time,
      location,
      totalAmount,
      adminCommission,
      workerAmount,
      hours: hours || 1,
      paymentStatus: "pending",
      bookingStatus: "pending",
      payoutStatus: "pending"
    });

    // ✅ FIXED: Send realtime notification to worker with location
    io.to(worker.userId.toString()).emit("newBooking", {
      message: "New Booking Received",
      booking: {
        _id: booking._id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        location: booking.location,  // ✅ USER'S ADDRESS WILL SHOW HERE
        totalAmount: booking.totalAmount,
        workerAmount: booking.workerAmount
      }
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: {
        _id: booking._id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        location: booking.location,  // ✅ Also in response
        totalAmount: booking.totalAmount,
        adminCommission: booking.adminCommission,
        workerAmount: booking.workerAmount,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { bookingStatus: "accepted" },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Booking accepted",
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { bookingStatus: "rejected" },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Booking rejected",
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // 🔥 userId → workerId
    const worker = await Worker.findOne({ userId: req.user.id });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // ✅ booking find
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // 🔐 check booking belongs to this worker
    if (booking.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // ❌ only accepted booking complete ho sakti hai
    if (booking.bookingStatus !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be completed"
      });
    }

    // ✅ ONLY booking complete karo
    booking.bookingStatus = "completed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking completed successfully",
      booking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId })
      .populate({
        path: "workerId",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      })
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.bookingStatus === 'pending').length,
      accepted: bookings.filter(b => b.bookingStatus === 'accepted').length,
      rejected: bookings.filter(b => b.bookingStatus === 'rejected').length,
      completed: bookings.filter(b => b.bookingStatus === 'completed').length,
      cancelled: bookings.filter(b => b.bookingStatus === 'cancelled').length,
      totalSpent: bookings
        .filter(b => b.bookingStatus === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };

    return res.json({
      success: true,
      count: bookings.length,
      stats,
      bookings: bookings.map(booking => ({
        _id: booking._id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        location: booking.location,
        totalAmount: booking.totalAmount,
        workerAmount: booking.workerAmount,
        adminCommission: booking.adminCommission,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        worker: booking.workerId?.userId ? {
          name: booking.workerId.userId.name,
          email: booking.workerId.userId.email,
          phone: booking.workerId.userId.phone
        } : null
      }))
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWorkerBookings = async (req, res) => {
  try {
    // Find worker by userId
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found. Please complete your profile first."
      });
    }

    // Get all bookings for this worker
    const bookings = await Booking.find({ workerId: worker._id })
      .populate('userId', 'name email phone') // Get customer details
      .sort({ createdAt: -1 }); // Latest first

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



