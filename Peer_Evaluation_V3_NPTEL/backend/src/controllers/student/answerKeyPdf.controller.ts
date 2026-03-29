import type { Request, Response, NextFunction } from "express";
import { Exam } from "../../models/Exam.ts";

export const getAnswerKeyPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;

    // Don't use .lean() if you're accessing Buffer fields
    const exam = await Exam.findById(examId);

    if (!exam || !exam.answerKeyPdf) {
      res.status(404).send("Answer key not found");
      return;
    }

    res.setHeader("Content-Type", exam.answerKeyMimeType || "application/pdf");

    const forceDownload = req.query.download === "true";
    res.setHeader(
      "Content-Disposition",
      `${forceDownload ? "attachment" : "inline"}; filename=answer-key.pdf`
    );

    res.send(exam.answerKeyPdf);
  } catch (error) {
    next(error);
  }
};
