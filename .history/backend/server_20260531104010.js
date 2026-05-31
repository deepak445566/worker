import express from "express"
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import connectDB from "./utils/db.js";
import cookie from "cookie";
// Import routes
import UserRouter from "./routes/authRoutes.js";
import router from "./routes/adminRoutes.js";
import ServiceRouter from "./routes/serviceRoutes.js";
import WorkerRouter from "./routes/workerRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to database
await connectDB();

// ✅ FIXED CORS - Allow multiple origins
const allowedOrigins = [
  "https://worker-ihaa.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", UserRouter);
app.use("/api/admin", router);
app.use("/api/services", ServiceRouter);
app.use("/api/bookings", WorkerRouter);

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;
    socket.userRole = decoded.role;

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id} - UserId: ${socket.userId}`);
  
  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`User ${socket.userId} joined room: ${socket.userId}`);
  }
  
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Manual join - User ${userId} joined room: ${userId}`);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`❌ Disconnected: ${socket.id} - UserId: ${socket.userId} - Reason: ${reason}`);
  });
  
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.userId}:`, error);
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});