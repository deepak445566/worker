import express from "express";
import { isAuth, loginUser, logout, registerUser } from "../controllers/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const UserRouter = express.Router();

UserRouter.post("/register", registerUser);
UserRouter.post("/login", loginUser);
// UserRouter.post("/verify", verifyEmail); // REMOVED - OTP verification no longer needed
UserRouter.get("/me", protect(), isAuth);
UserRouter.post("/logout", logout);

export default UserRouter;