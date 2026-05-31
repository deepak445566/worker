import express from "express";

import {
  createBooking,
  acceptBooking,
  rejectBooking,
  getUserBookings,
  completeBooking,
  getWorkerBookings,

} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const WorkerRouter = express.Router();

WorkerRouter.post("/", protect("user"), createBooking);

WorkerRouter.put("/accept/:bookingId", protect("worker"), acceptBooking);
WorkerRouter.put("/reject/:bookingId", protect("worker"), rejectBooking);
WorkerRouter.get("/worker/my-bookings", protect("worker"), getWorkerBookings);
WorkerRouter.put("/booking/:bookingId/complete", protect("worker"), completeBooking);
WorkerRouter.get("/my-bookings", protect("user"), getUserBookings);


export default WorkerRouter;