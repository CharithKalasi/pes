import type { Request, Response, NextFunction } from "express";
import { Exam } from "../../models/Exam.ts";

export const getQuestionPaperPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam || !exam.questionPaperPdf) {
      res.status(404).send("Question paper not found");
      return;
    }

    res.setHeader(
      "Content-Type",
      exam.questionPaperMimeType || "application/pdf"
    );

    const forceDownload = req.query.download === "true";
    res.setHeader(
      "Content-Disposition",
      `${forceDownload ? "attachment" : "inline"}; filename=question-paper.pdf`
    );

    res.send(exam.questionPaperPdf);
  } catch (error) {
    next(error);
  }
};
