// import { Request, Response } from 'express';
// import { User } from '../../models/User.ts';
// import { Course } from '../../models/Course.ts';
// import mongoose from 'mongoose';
// //import bcrypt from 'bcryptjs';

// /*export const getAllStudents = async (_req: Request, res: Response) => {
//   try {
//     const students = await User.find({ role: 'student' });
//     res.json(students);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch students', error });
//   }
// };*/

// /*export const getStudentById = async (req: Request, res: Response) => {
//   try {
//     const student = await User.findOne({ _id: req.params.id, role: 'student' });
//     if (!student) return res.status(404).json({ message: 'Student not found' });
//     res.json(student);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch student', error });
//   }
// };*/

// /*export const createStudent = async (req: Request, res: Response) => {
//   try {
//     const { name, email, password, enrolledCourses = [], reputationScore = 0 } = req.body;

//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ message: 'Email already exists' });

//     const hashedPassword = await bcrypt.hash(password, 10); // Hash password

//     const newStudent = new User({
//       name,
//       email,
//       password: hashedPassword, // Store hashed password
//       role: 'student',
//       enrolledCourses,
//       reputationScore
//     });

//     await newStudent.save();
//     res.status(201).json(newStudent);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create student', error });
//   }
// };*/

// /*export const updateStudent = async (req: Request, res: Response) => {
//   try {
//     const updatedStudent = await User.findOneAndUpdate(
//       { _id: req.params.id, role: 'student' },
//       req.body,
//       { new: true }
//     );

//     if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });
//     res.json(updatedStudent);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update student', error });
//   }
// };*/

// /*export const deleteStudent = async (req: Request, res: Response) => {
//   try {
//     const deletedStudent = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
//     if (!deletedStudent) return res.status(404).json({ message: 'Student not found' });
//     res.json({ message: 'Student deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete student', error });
//   }
// };*/

// // Assign student to course
// export const assignStudentToCourse = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, courseCode } = req.body;
//     const student = await User.findOne({ email, role: 'student' });
//     if (!student) return void res.status(404).json({ message: 'Student not found' });

//     const course = await Course.findOne({ code: courseCode });
//     if (!course) return void res.status(404).json({ message: 'Course not found' });

//     const courseId = new mongoose.Types.ObjectId(course._id as string);
//     const alreadyEnrolled = student.enrolledCourses.some((id) => new mongoose.Types.ObjectId(id).equals(courseId));

//     if (!alreadyEnrolled) {
//       student.enrolledCourses.push(courseId);
//       await student.save();
//     }

//     res.status(200).json({ message: 'Student assigned to course successfully' });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to assign student to course', details: err.message });
//   }
// };

// // Unassign student from course
// export const unassignStudentFromCourse = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, courseCode } = req.body;
//     const student = await User.findOne({ email, role: 'student' });
//     if (!student) return void res.status(404).json({ message: 'Student not found' });

//     const course = await Course.findOne({ code: courseCode });
//     if (!course) return void res.status(404).json({ message: 'Course not found' });

//     const courseId = new mongoose.Types.ObjectId(course._id as string);
//     student.enrolledCourses = student.enrolledCourses.filter(
//       (id) => !new mongoose.Types.ObjectId(id).equals(courseId)
//     );

//     await student.save();
//     res.status(200).json({ message: 'Student unassigned from course successfully' });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to unassign student from course', details: err.message });
//   }
// };

// // Get all students with enrolled courses
// export const getAllStudents = async (_req: Request, res: Response) => {
//   try {
//     const students = await User.find({ role: 'student' }).populate('enrolledCourses', 'name code');
//     res.status(200).json(students);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch students' });
//   }
// };

// // Delete student by email
// export const deleteStudent = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.params;
//     const deleted = await User.findOneAndDelete({ email, role: 'student' });
//     if (!deleted) return res.status(404).json({ error: 'Student not found' });
//     res.status(200).json({ message: 'Student deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to delete student' });
//   }
// };
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../../models/User.ts";
import { Course } from "../../models/Course.ts";

export const getAllStudents = async (_req: Request, res: Response) => {
  try {
    const students = await User.find({ role: "student" }).populate(
      "enrolledCourses",
      "name code"
    );
    res.status(200).json(students);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const deleted = await User.findOneAndDelete({ email, role: "student" });

    if (!deleted) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Failed to delete student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
};

export const assignStudentToCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const student = await User.findOne({ email, role: "student" });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const courseId = new mongoose.Types.ObjectId(String(course._id));
    const alreadyEnrolled = student.enrolledCourses.some((id) =>
      new mongoose.Types.ObjectId(String(id)).equals(courseId)
    );

    if (!alreadyEnrolled) {
      student.enrolledCourses.push(courseId);
      await student.save();
    }

    res.status(200).json({ message: "Student assigned to course successfully" });
  } catch (error: any) {
    console.error("Failed to assign student to course:", error);
    res.status(500).json({
      error: "Failed to assign student to course",
      details: error.message,
    });
  }
};

export const unassignStudentFromCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const student = await User.findOne({ email, role: "student" });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const courseId = new mongoose.Types.ObjectId(String(course._id));
    student.enrolledCourses = student.enrolledCourses.filter(
      (id) => !new mongoose.Types.ObjectId(String(id)).equals(courseId)
    );

    await student.save();
    res.status(200).json({ message: "Student unassigned from course successfully" });
  } catch (error: any) {
    console.error("Failed to unassign student from course:", error);
    res.status(500).json({
      error: "Failed to unassign student from course",
      details: error.message,
    });
  }
};
