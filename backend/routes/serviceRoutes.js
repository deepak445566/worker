import express from "express";
import { getAllWorkers, getWorkerBookingStats, getWorkerEarnings, getWorkerProfile, getWorkersByService } from "../controllers/serviceControllers.js";
import { protect } from "../middleware/authMiddleware.js";





const ServiceRouter = express.Router();

ServiceRouter.get("/all",getAllWorkers);
ServiceRouter.get("/", getWorkersByService);
ServiceRouter.get("/worker/earnings",protect("worker"),getWorkerEarnings);
ServiceRouter.get("/worker/profile", protect("worker"), getWorkerProfile);
ServiceRouter.get("/worker/booking-stats", protect("worker"), getWorkerBookingStats);
export default ServiceRouter;
