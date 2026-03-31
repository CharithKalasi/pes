// import type { Request, Response } from 'express';
// import { User } from '../../models/User.ts';
// import { Course } from '../../models/Course.ts';
// import mongoose from 'mongoose';

// // Create teacher
// /*export const createTeacher = async (req: Request, res: Response) => {
//   try {
//     const newTeacher = new User({ ...req.body, role: 'teacher' });
//     await newTeacher.save();
//     res.status(201).json(newTeacher);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to create teacher', details: err });
//   }
// };*/

// export const assignTeacherToCourse = async (req: Request, res: Response): Promise<void> => {
//   console.log("🧠 assignTeacherToCourse called with body:", req.body);
//   try {
//     const { email, courseCode } = req.body;
//     console.log("Received:", { email, courseCode });

//     const teacher = await User.findOne({ email, role: 'teacher' });
//     if (!teacher) {
//       console.log("❌ Teacher not found");
//       res.status(404).json({ message: 'Teacher not found' });
//       return;
//     }

//     const course = await Course.findOne({ code: courseCode });
//     if (!course) {
//       console.log("❌ Course not found");
//       res.status(404).json({ message: 'Course not found' });
//       return;
//     }

//     console.log("✅ Found teacher and course:", { teacherId: teacher._id, courseId: course._id });

//     const courseId = new mongoose.Types.ObjectId(course._id as string);

//     const alreadyAssigned = teacher.enrolledCourses.some(
//       (id) => new mongoose.Types.ObjectId(id.toString()).equals(courseId)
//     );

//     console.log("🔁 Already assigned?", alreadyAssigned);

//     if (!alreadyAssigned) {
//       teacher.enrolledCourses.push(courseId);
//       const result = await teacher.save();
//       console.log("✅ Save success. Updated enrolledCourses:", result.enrolledCourses);
//     } else {
//       console.log("⏭️ Already assigned. Skipping update.");
//     }

//     res.status(200).json({ message: 'Teacher assigned to course successfully' });
//   } catch (error: any) {
//     console.error("🔥 Exception caught in assignTeacherToCourse:");
//     console.error(error.name, error.message, error.stack);

//     res.status(500).json({ error: 'Failed to update teacher', details: error.message });
//   }
// };



// // Get all teachers
// export const getAllTeachers = async (_req: Request, res: Response) => {
//   try {
//     const teachers = await User.find({ role: 'teacher' })
//       .populate('enrolledCourses', 'name code');
//     res.status(200).json(teachers);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch teachers' });
//   }
// };

// // Get teacher by id
// /*export const getTeacherById = async (req: Request, res: Response) => {
//   try {
//     const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
//     if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
//     res.status(200).json(teacher);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch teacher' });
//   }
// };*/

// // Update teacher
// /*export const updateTeacher = async (req: Request, res: Response) => {
//   try {
//     const updated = await User.findOneAndUpdate(
//       { _id: req.params.id, role: 'teacher' },
//       req.body,
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ error: 'Teacher not found' });
//     res.status(200).json(updated);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update teacher' });
//   }
// };*/

// // Delete teacher
// export const deleteTeacher = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.params;
//     console.log("Deleting teacher with email:", email);
    
//     const deleted = await User.findOneAndDelete({ email, role: 'teacher' });

//     if (!deleted) return res.status(404).json({ error: 'Teacher not found' });
//     res.status(200).json({ message: 'Teacher deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to delete teacher' });
//   }
// };

// export const unassignTeacherFromCourse = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, courseCode } = req.body;

//     const teacher = await User.findOne({ email, role: 'teacher' });
//     if (!teacher) {
//       return void res.status(404).json({ message: 'Teacher not found' });
//     }

//     const course = await Course.findOne({ code: courseCode });
//     if (!course) {
//       return void res.status(404).json({ message: 'Course not found' });
//     }

//     const courseId = new mongoose.Types.ObjectId((course._id as string).toString());

//     // Remove course ID if it exists
//     teacher.enrolledCourses = teacher.enrolledCourses.filter(
//       (id) => !new mongoose.Types.ObjectId(id).equals(courseId)
//     );

//     await teacher.save();
//     res.status(200).json({ message: 'Course unassigned from teacher successfully' });
//   } catch (error: any) {
//     console.error("🔥 Exception in unassignTeacherFromCourse:", error);
//     res.status(500).json({ error: 'Failed to unassign course from teacher', details: error.message });
//   }
// };
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../../models/User.ts";
import { Course } from "../../models/Course.ts";

export const getAllTeachers = async (_req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: "teacher" }).populate(
      "enrolledCourses",
      "name code"
    );
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const deleted = await User.findOneAndDelete({ email, role: "teacher" });

    if (!deleted) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Failed to delete teacher:", error);
    res.status(500).json({ error: "Failed to delete teacher" });
  }
};

export const assignTeacherToCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const teacher = await User.findOne({ email, role: "teacher" });

    if (!teacher) {
      res.status(404).json({ message: "Teacher not found" });
      return;
    }

    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const courseId = new mongoose.Types.ObjectId(String(course._id));
    const alreadyAssigned = teacher.enrolledCourses.some((id) =>
      new mongoose.Types.ObjectId(String(id)).equals(courseId)
    );

    if (!alreadyAssigned) {
      teacher.enrolledCourses.push(courseId);
      await teacher.save();
    }

    res.status(200).json({ message: "Teacher assigned to course successfully" });
  } catch (error: any) {
    console.error("Failed to assign teacher to course:", error);
    res.status(500).json({
      error: "Failed to update teacher",
      details: error.message,
    });
  }
};

export const unassignTeacherFromCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const teacher = await User.findOne({ email, role: "teacher" });

    if (!teacher) {
      res.status(404).json({ message: "Teacher not found" });
      return;
    }

    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const courseId = new mongoose.Types.ObjectId(String(course._id));
    teacher.enrolledCourses = teacher.enrolledCourses.filter(
      (id) => !new mongoose.Types.ObjectId(String(id)).equals(courseId)
    );

    await teacher.save();
    res.status(200).json({ message: "Course unassigned from teacher successfully" });
  } catch (error: any) {
    console.error("Failed to unassign teacher from course:", error);
    res.status(500).json({
      error: "Failed to unassign course from teacher",
      details: error.message,
    });
  }
};
