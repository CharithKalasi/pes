import type { Response } from "express";
import { Batch } from "../../models/Batch.ts";
import { User } from "../../models/User.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";

export const getBatchStudents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const teacherId = req.user._id;
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;   
    }

    if (batch.instructor.toString() !== teacherId.toString()) {
      res.status(403).json({ message: "Not authorized for this batch" });
      return;
    }

    const students = await User.find(
      { _id: { $in: batch.students } },
      "name email"
    );

    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};
