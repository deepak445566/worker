import express from "express";
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

// ✅ FIXED CORS - Add your frontend URL
const allowedOrigins = [
  "https://worker-ihaa.vercel.app",
  "https://worker-ibbp.onrender.com", // Your backend URL
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
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

// ✅ FIXED SOCKET.IO with better error handling
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// ✅ Socket middleware with better token extraction
io.use((socket, next) => {
  try {
    // Try to get token from multiple sources
    let token = socket.handshake.auth.token;
    
    // Also try from handshake headers
    if (!token && socket.handshake.headers.authorization) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }
    
    // Try from cookies
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.token;
    }
    
    console.log('Socket auth - Token present:', !!token);
    
    if (!token) {
      console.log('❌ No token provided for socket connection');
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    
    console.log(`✅ Socket authenticated: ${socket.userId} (${socket.userRole})`);
    next();
  } catch (err) {
    console.log('❌ Socket authentication error:', err.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id} - UserId: ${socket.userId} - Role: ${socket.userRole}`);
  
  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`📡 User ${socket.userId} joined room: ${socket.userId}`);
    
    // Send confirmation to client
    socket.emit('connected', { 
      message: 'Connected to server',
      userId: socket.userId,
      socketId: socket.id
    });
  }
  
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Manual join - User ${userId} joined room: ${userId}`);
      socket.emit('joined', { userId, socketId: socket.id });
    }
  });
  
  socket.on("ping", () => {
    socket.emit("pong");
  });
  
  socket.on("workerOnline", (data) => {
    console.log(`🔵 Worker ${socket.userId} is now online`);
    socket.broadcast.emit('workerStatusChanged', { userId: socket.userId, status: 'online' });
  });
  
  socket.on("workerOffline", (data) => {
    console.log(`🔴 Worker ${socket.userId} is now offline`);
    socket.broadcast.emit('workerStatusChanged', { userId: socket.userId, status: 'offline' });
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

app.get('/api/socket-test', (req, res) => {
  res.json({ 
    message: 'Socket server is running',
    clients: io.engine.clientsCount 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});