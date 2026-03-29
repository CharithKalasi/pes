// This file defines the Express route for the admin dashboard to fetch counts of teachers, courses, and students.
import express from 'express';
import type { Request, Response } from 'express';
import { User } from '../../models/User.ts';
import { Course } from '../../models/Course.ts';
import { Batch } from '../../models/Batch.ts';
import { Exam } from '../../models/Exam.ts';
import { authMiddleware } from '../../middlewares/authMiddleware.ts'; 

const router = express.Router();

router.get('/counts', async (req: Request, res: Response) => {
  try {
    const teachersCount = await User.countDocuments({ role: 'teacher' });
    const coursesCount = await Course.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const batchesCount = await Batch.countDocuments();
    const examsCount = await Exam.countDocuments();

    res.json({
      teachers: teachersCount,
      courses: coursesCount,
      students: studentsCount,
      batches: batchesCount,
      exams: examsCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

// --- Add this route for fetching teacher profile ---
router.get('/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      // You can include more fields as needed
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
