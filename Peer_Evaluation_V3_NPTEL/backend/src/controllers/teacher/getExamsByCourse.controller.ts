import type { Request, Response, NextFunction } from "express";
import { Exam } from "../../models/Exam.ts";
import { Batch } from "../../models/Batch.ts";

export const getExamsByCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { courseId } = req.params;

    if (!teacherId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find batches of this course taught by this teacher
    const batches = await Batch.find({ course: courseId, instructor: teacherId }).select("_id");

    const batchIds = batches.map(b => b._id);

    // Find all exams under these batches
    const exams = await Exam.find({
      course: courseId,
      batch: { $in: batchIds },
    })
      .populate("batch", "name")
      .sort({ startTime: -1 });

    res.json({ exams });
  } catch (err) {
    console.error("Failed to fetch exams:", err);
    next(err);
  }
};
