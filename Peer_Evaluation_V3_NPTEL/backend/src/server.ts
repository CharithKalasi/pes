import express from "express";
import { Request, Response, NextFunction } from 'express';
import connectDB from "./config/db.ts";
import studentRoutes from "./routes/student/student.routes.ts";
import taRoutes from "./routes/ta/ta.routes.ts"; 
import teacherRoutes from "./routes/teacher/teacher.routes.ts";
import authRoutes from './routes/authorization/auth.routes.ts';
import adminroutes from './routes/admin/admin.routes.ts';
import dashboardRoutes from './routes/admin/dashboard.ts';

import "./models/Course.ts";
import "./models/Batch.ts";
import "./models/Exam.ts";
import "./models/User.ts";
import "./models/Flag.ts"; 
import "./models/UIDMap.ts";

import cors from 'cors';
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED CORS (multiple origins)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/admin", adminroutes);
app.use("/api/student", studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ta', taRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});