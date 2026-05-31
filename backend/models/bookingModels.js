import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // 👤 user jisne booking ki
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 👨‍🔧 worker jisko assign hua
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true
    },

    // 🔧 service type
    service: {
      type: String,
      required: true
    },

    // 📅 booking date
    date: {
      type: String,
      required: true
    },

    // ⏰ time slot
    time: {
      type: String,
      required: true
    },

    // 📍 user location
        location: {
      type: String,  // ✅ Changed from object to string
      required: true  // Optional: make it required if needed
    },


    // 💰 total amount
    totalAmount: {
      type: Number,
      required: true
    },

    // 💰 admin ka 10%
    adminCommission: {
      type: Number
    },

    // 💰 worker earning
    workerAmount: {
      type: Number
    },

    // 💳 payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    // 📦 booking status
    bookingStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending"
    },

    // 💸 payout (admin → worker)
    payoutStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;