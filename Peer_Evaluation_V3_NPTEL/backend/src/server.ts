import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.ts";

import studentRoutes from "./routes/student/student.routes.ts";
import taRoutes from "./routes/ta/ta.routes.ts";
import teacherRoutes from "./routes/teacher/teacher.routes.ts";
import authRoutes from "./routes/authorization/auth.routes.ts";
import adminroutes from "./routes/admin/admin.routes.ts";
import notificationRoutes from "./routes/notification/notification.routes.ts";
import dashboardRoutes from "./routes/admin/dashboard.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://pes-43t8.vercel.app",
].filter(Boolean);

/* CORS */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

/* SAFE START */
const start = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.use("/api/admin", adminroutes);
    app.use("/api/student", studentRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/ta", taRoutes);
    app.use("/api/teacher", teacherRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/notifications", notificationRoutes);

    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Server failed to start:", err);
  }
};

start();
