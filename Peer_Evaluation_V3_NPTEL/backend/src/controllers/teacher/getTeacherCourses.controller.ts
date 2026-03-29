import type { Response, NextFunction } from "express";
import { Batch } from "../../models/Batch.ts";
import type { IBatch } from "../../models/Batch.ts";
import type { ICourse } from "../../models/Course.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";

export const getTeacherCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    if (!teacherId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const batches = await Batch.find({ instructor: teacherId })
      .populate({
        path: "course",
        select: "name code",
      })
      .select("name course");

    const courseMap: Record<
      string,
      {
        _id: string;
        name: string;
        code: string;
        batches: { _id: string; name: string }[];
      }
    > = {};

    batches.forEach((batchDoc) => {
      const batch = batchDoc as unknown as IBatch & { _id: any; course: ICourse & { _id: any } };
      const course = batch.course;

      const courseId = course._id.toString();
      const batchId = batch._id.toString();

      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          _id: courseId,
          name: course.name,
          code: course.code,
          batches: [],
        };
      }

      courseMap[courseId].batches.push({
        _id: batchId,
        name: batch.name,
      });
    });

    const courses = Object.values(courseMap);
    res.status(200).json({ courses });
  } catch (err) {
    console.error("Error fetching teacher courses:", err);
    next(err);
  }
};
