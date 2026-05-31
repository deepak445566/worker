
import express from "express";
import { adminLogin, getAdminCommission, getAllWorkers } from "../controllers/adminControllers.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/login", adminLogin);


router.get("/workers", protectAdmin, getAllWorkers);

router.get("/commissions",protectAdmin,getAdminCommission);
export default router;