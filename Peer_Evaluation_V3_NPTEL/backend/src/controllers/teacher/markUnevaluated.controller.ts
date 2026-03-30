import type { Request, Response, NextFunction } from "express";
import { Evaluation } from "../../models/Evaluation.ts";
import { Ticket } from "../../models/Ticket.ts";
import { Batch } from "../../models/Batch.ts";
import type { AuthenticatedRequest } from "../../middlewares/authMiddleware.ts";

export const generateTicketsForPendingEvaluations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { examId } = req.params;

  if (!examId) {
    res.status(400).json({ error: "Missing examId" });
    return;
  }

  try {
    const pendingEvaluations = await Evaluation.find({
      exam: examId,
      status: "pending",
    });

    if (pendingEvaluations.length === 0) {
      res.status(200).json({ message: "No pending evaluations found." });
      return;
    }

    const studentIds = Array.from(
      new Set(pendingEvaluations.map((e) => e.evaluatee.toString()))
    );
    const batches = await Batch.find({ students: { $in: studentIds } }).lean();

    const studentToBatchTAInfo: Record<
      string,
      { tas: string[]; index: number }
    > = {};

    for (const batch of batches) {
      const tas = batch.ta.map((taId) => taId.toString());
      for (const studentId of batch.students.map((id) => id.toString())) {
        if (tas.length > 0) {
          studentToBatchTAInfo[studentId] = {
            tas,
            index: Math.floor(Math.random() * tas.length),
          };
        }
      }
    }

    const createdTickets = [];

    for (const evalDoc of pendingEvaluations) {
      const existingTicket = await Ticket.exists({
        student: evalDoc.evaluatee,
        evaluator: evalDoc.evaluator,
        exam: evalDoc.exam,
      });

      if (existingTicket) continue;

      const studentId = evalDoc.evaluatee.toString();
      const taInfo = studentToBatchTAInfo[studentId];

      let taId: string | null = null;
      if (taInfo && taInfo.tas.length > 0) {
        taId = taInfo.tas[taInfo.index];
        taInfo.index = (taInfo.index + 1) % taInfo.tas.length;
      }

      evalDoc.marks = new Array(evalDoc.marks.length).fill(0);
      evalDoc.flagged = true;
      await evalDoc.save();

      const ticket = new Ticket({
        student: evalDoc.evaluatee,
        evaluator: evalDoc.evaluator,
        ta: taId,
        exam: evalDoc.exam,
        message: "unchecked",
        status: "open",
        escalatedToTeacher: false,
      });

      await ticket.save();
      createdTickets.push(ticket);
    }

    if (createdTickets.length === 0) {
      res.status(200).json({
        message: "All pending evaluations already have tickets.",
      });
      return;
    }

    res.status(201).json({
      message: `${createdTickets.length} tickets created for pending evaluations.`,
      tickets: createdTickets.length,
    });
  } catch (error) {
    console.error("Error generating tickets:", error);
    next(error);
  }
};
