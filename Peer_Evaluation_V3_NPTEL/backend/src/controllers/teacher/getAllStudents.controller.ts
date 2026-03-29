// controllers/teacher/getAllStudents.controller.ts
import type { Response } from "express";
import { User } from "../../models/User.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";

export const getAllStudents = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const students = await User.find({ role: "student" }, "name email");
    res.status(200).json({ students });
  } catch (err) {
    console.error("Failed to fetch students:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaCandidates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      res.status(400).json({ message: "Course ID is required" });
      return;
    }

    const studentsNotInCourse = await User.find(
      {
        role: "student",
        enrolledCourses: { $ne: courseId },
      },
      "name email"
    );
    res.status(200).json({ students: studentsNotInCourse });
  } catch (error) {
    console.error("Failed to fetch students that can be made TA.", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
