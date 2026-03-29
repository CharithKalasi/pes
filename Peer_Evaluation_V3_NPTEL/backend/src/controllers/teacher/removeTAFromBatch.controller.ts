import type { Response } from "express";
import { Batch } from "../../models/Batch.ts";
import { User } from "../../models/User.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";
import { sendReminderEmail } from "../../utils/email.ts";  // ✅ Correct import

export const removeTAFromBatch = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { batchId, taId } = req.params;


    const batch = await Batch.findById(batchId);
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    if (batch.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Not authorized to modify this batch" });
      return;
    }

    const index = batch.ta.findIndex((id) => id.toString() === taId);
    if (index === -1) {
      res.status(400).json({ message: "TA not found in this batch" });
      return;
    }

    // Remove TA from batch
    batch.ta.splice(index, 1);
    await batch.save();

    // Fetch TA details to notify
    const taUser = await User.findById(taId);
    if (taUser) {
      await sendReminderEmail(
        taUser.email,
        "TA Role Removed",
        `Dear ${taUser.name},\n\nYou have been removed from your Teaching Assistant role for the batch "${batch.name}".\n\nIf you have any questions, feel free to contact your instructor.\n\nRegards,\nPeer Evaluation Team`
      );
    }

    res.json({ message: "TA removed and notified via email", batch });
  } catch (err) {
    console.error("Remove TA Internal Error:", err);
    res.status(500).json({ message: "Failed to remove TA", error: err });
  }
};
