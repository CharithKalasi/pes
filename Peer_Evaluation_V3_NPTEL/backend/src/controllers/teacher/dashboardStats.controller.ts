import type { Response } from "express";
import { Batch } from "../../models/Batch.ts";
import { Exam } from "../../models/Exam.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";

export const getTeacherDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "teacher") {
      res.status(403).json({ message: "Access denied: Teacher only." });
      return;
    }

    // 🔍 Step 1: Find all batches assigned to the teacher
    const teacherBatches = await Batch.find({ instructor: user._id }).select(
      "_id course"
    );

    const batchIds = teacherBatches.map((batch) => batch._id);
    const courseSet = new Set<string>();
    teacherBatches.forEach((batch) => {
      if (batch.course) courseSet.add(batch.course.toString());
    });

    const coursesCount = courseSet.size;
    const batchesCount = batchIds.length;

    // 🔍 Step 2: Count all exams assigned to those batches
    const examsCount = await Exam.countDocuments({
      batch: { $in: batchIds },
    });

    res.json({
      isTeacher: true,
      coursesCount,
      batchesCount,
      examsCount,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
