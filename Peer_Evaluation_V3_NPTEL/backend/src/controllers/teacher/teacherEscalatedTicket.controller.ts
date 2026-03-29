import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TeacherTicket } from '../../models/TeacherTicket.ts';
import { Exam } from '../../models/Exam.ts';
import { Batch } from '../../models/Batch.ts';
import { Evaluation } from '../../models/Evaluation.ts';
import catchAsync from '../../utils/catchAsync.ts';
import { sendTicketResolvedEmail } from '../../utils/email.ts';

export const getAllEscalatedTickets = catchAsync(async (req: Request, res: Response) => {
  const teacherId = (req as any).user.id;

  // Find all batches where the current teacher is the instructor
  const batches = await Batch.find({ instructor: teacherId });
  const batchIds = batches.map(batch => batch._id);

  // Find all exams for these batches
  const exams = await Exam.find({ batch: { $in: batchIds } });
  const examIds = exams.map(exam => exam._id);

  // Find evaluations related to these exams
  const evaluations = await Evaluation.find({ exam: { $in: examIds } });
  const evaluationIds = evaluations.map(evaluation => evaluation._id);

  // Find teacher tickets related to these evaluations
  const tickets = await TeacherTicket.find({
    resolved: false,
    evaluationId: { $in: evaluationIds }
  })
    .populate('student')
    .populate('ta')
    .populate({
      path: 'evaluationId',
      populate: {
        path: 'exam',
        populate: {
          path: 'batch',
          select: 'name instructor'
        }
      }
    });

  res.status(200).json({ success: true, data: tickets });
});

export const resolveTicket = catchAsync(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const { remark, marksUpdated } = req.body;
  const teacherId = (req as any).user.id;

  const ticket = await TeacherTicket.findById(ticketId)
    .populate('student')
    .populate({
      path: 'evaluationId',
      populate: {
        path: 'exam',
        populate: {
          path: 'batch',
          select: 'instructor'
        }
      }
    });

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const evaluation = ticket.evaluationId as any;
  if (
    !evaluation ||
    !evaluation.exam ||
    !evaluation.exam.batch ||
    evaluation.exam.batch.instructor.toString() !== teacherId
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to resolve this ticket' });
  }

  ticket.resolved = true;
  ticket.remark = remark;
  ticket.resolvedAt = new Date();
  ticket.marksUpdated = marksUpdated ?? null;
  await ticket.save();

  const student = ticket.student as any;

  if (student?.email) {
    await sendTicketResolvedEmail(
      student.email,
      student.name || 'Student',
      ticket.subject,
      ticket.description,
      remark,
      (ticket._id as mongoose.Types.ObjectId).toString(),
      ticket.marksUpdated
    );
  }

  res.status(200).json({ success: true, message: 'Ticket resolved and email sent successfully' });
});

export const getResolvedTickets = catchAsync(async (req: Request, res: Response) => {
  const teacherId = (req as any).user.id;

  // Find all batches for this teacher
  const batches = await Batch.find({ instructor: teacherId });
  const batchIds = batches.map(batch => batch._id);

  // Exams for these batches
  const exams = await Exam.find({ batch: { $in: batchIds } });
  const examIds = exams.map(exam => exam._id);

  // Evaluations for these exams
  const evaluations = await Evaluation.find({ exam: { $in: examIds } });
  const evaluationIds = evaluations.map(evaluation => evaluation._id);

  const tickets = await TeacherTicket.find({
    resolved: true,
    evaluationId: { $in: evaluationIds }
  })
    .populate('student')
    .populate('ta')
    .sort({ resolvedAt: -1 });

  res.status(200).json({ success: true, data: tickets });
});
