import type { Request, Response, NextFunction } from "express";
import { Evaluation } from "../../models/Evaluation.ts";
import type { IUser } from "../../models/User.ts";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface User {
      _id: string;
      role: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export const getEvaluationResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user?._id?.toString();
    if (!studentId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const evaluations = await Evaluation.find({
      evaluatee: studentId,
      status: "completed",
    })
      .populate({
        path: "exam",
        select: "title startTime course batch",
        populate: [
          { path: "course", select: "name" },
          { path: "batch", select: "name" },
        ],
      })
      .populate({
        path: "evaluator",
        model: "User",
        select: "name",
      });

    if (!evaluations || evaluations.length === 0) {
      res.status(200).json({ message: "No evaluations found" });
      return;
    }

    const resultsMap: Record<string, any> = {};

    evaluations.forEach((ev) => {
      const examKey = ev.exam?._id?.toString() || "unknown";

      if (!resultsMap[examKey]) {
        resultsMap[examKey] = {
          exam: ev.exam,
          marksList: [],
          feedbackList: [],
          evaluators: [],
        };
      }

      const evaluator =
        typeof ev.evaluator === "object" && "name" in ev.evaluator
          ? {
              _id: ev.evaluator._id.toString(),
              name: (ev.evaluator as unknown as IUser).name,
            }
          : {
              _id: ev.evaluator?.toString() || "unknown",
              name: "Unknown",
            };

      resultsMap[examKey].marksList.push(ev.marks);
      resultsMap[examKey].feedbackList.push(ev.feedback);
      resultsMap[examKey].evaluators.push(evaluator);
    });

    const results = Object.values(resultsMap).map((group: any) => {
      // Compute total per evaluator
      const totalPerEvaluator = group.marksList.map(
        (marks: number[]) => marks.reduce((sum, mark) => sum + mark, 0)
      );

      const avg =
        totalPerEvaluator.length > 0
          ? (
              totalPerEvaluator.reduce((sum: number, total: number) => sum + total, 0) /
              totalPerEvaluator.length
            ).toFixed(2)
          : null;

      return {
        exam: {
          _id: group.exam._id,
          title: group.exam.title,
          startTime: group.exam.startTime,
          courseName: group.exam.course?.name || "Unknown Course",
          batchId: group.exam.batch?._id || null,
          batchName: group.exam.batch?.name || "Unknown Batch",
        },
        averageMarks: avg,
        marks: group.marksList,
        feedback: group.feedbackList,
        evaluators: group.evaluators,
      };
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
