import type { Request, Response } from "express";
import { Course } from "../../models/Course.ts";
import { Batch } from "../../models/Batch.ts";
import { User } from "../../models/User.ts";
//import jwt from "jsonwebtoken";

// Add a new course
export const addCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, startDate, endDate } = req.body;

    var sdate = new Date(startDate);
    var edate = new Date(endDate);
    if (edate<=sdate){
      res.status(409).json({ message: "The start date is greater than end date" });
      return;  
      }    
    // ✅ Check for duplicate code
    const existing = await Course.findOne({ code });
    if (existing) {
      res.status(409).json({ message: "Course code already exists" });
      return;
    }

    // ✅ Validate teacher exists and is a teacher
    
    // ✅ Create course
    const course = await Course.create({
      name,
      code,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
    const responseCourse = {
      ...course.toObject(),
      startDate: course.startDate.toISOString().split("T")[0],
      endDate: course.endDate.toISOString().split("T")[0],
    };


    res.status(201).json(responseCourse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add course", error: err });
  }
};

// Update an existing course
/*export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const updated = await Course.findByIdAndUpdate(courseId, req.body, { new: true });

    if (!updated) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update course", error: err });
  }
};*/

// Delete a course and all its batches by course code
// export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { code } = req.params;
//     console.log("Trying to delete course with code:", code);

//     const course = await Course.findOne({ code });

//     if (!course) {
//       res.status(404).json({ message: "Course not found" });
//       return;
//     }

//     await Batch.deleteMany({ course: course._id });
//     await Course.findByIdAndDelete(course._id);

//     res.status(204).send(); // No content
//   } catch (err) {
//     console.error("Error deleting course:", err);
//     res.status(500).json({ message: "Failed to delete course", error: err });
//   }
// };

// ✅ New function: Delete course by ID and its batches (used in /:courseId route)
export const deleteCourseAndBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    await Batch.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);

    res.status(204).send();
    
  } catch (err) {
    console.error("Error deleting course by ID:", err);
    res.status(500).json({ message: "Failed to delete course by ID", error: err });
  }
};

// Get all courses
export const getAllCourses = async (_req: Request, res: Response) => {
  const courses = await Course.find();
  console.log("All course codes:", courses.map(c => c.code));
  res.json(courses);
};


// Get course by ID
/*export const getCourseById = async (req: Request, res: Response) => {
  console.log("Searching for course with ID:", req.params.id);
  const course = await Course.findById(req.params.id);
  console.log("Course found:", course);
  course ? res.json(course) : res.status(404).json({ message: 'Course not found' });
};*/

export const updateStudentTaRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    // Validate input
    if (!email || !role || !["student", "teacher", "admin"].includes(role)) {
      res.status(400).json({
        message: "Valid email and role (student, teacher, admin) are required. Changing to TA is not allowed directly."
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Prevent changing to TA directly
    if (role === "ta") {
      res.status(400).json({ message: "Changing to TA is not allowed directly." });
      return;
    }

    // Prevent changing to the same role
    if (user.role === role) {
      res.status(400).json({ message: `User already has the role '${role}'. No update performed.` });
      return;
    }

    // Update role
    user.role = role;
    await user.save();

    res.status(200).json({ message: `Role updated to ${role}.`, user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};


export const getAllBatches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const batches = await Batch.find()
      .populate('course', 'code name')
      .populate('instructor', 'name email')
      .populate('ta', 'name email');
    console.log("All batches:", batches.map(b => ({ id: b._id, name: b.name })));
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve batches', error: err });
  }
};

// Get batch by ID
/*export const getBatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Searching for batch with ID:", req.params.id);
    const batch = await Batch.findById(req.params.id).populate('course', 'code name');
    console.log("Batch found:", batch);

    if (batch) {
      res.json(batch);
    } else {
      res.status(404).json({ message: 'Batch not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve batch', error: err });
  }
};*/

// Create a batch for a course

// export const createBatch = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { name, courseId, students } = req.body;

//     // Step 1: Check if course exists
//     const course = await Course.findById(courseId);
//     if (!course) {
//       res.status(404).json({ message: "Course not found" });
//       return;
//     }

//     // Step 2: Check if a batch with the same name exists for this course
//     const existingBatch = await Batch.findOne({ name, course: courseId });
//     if (existingBatch) {
//       res.status(400).json({ message: "Batch name already exists for this course" });
//       return;
//     }

//     // Step 3: Create batch
//     const batch = await Batch.create({ name, course: courseId, students });
//     res.status(201).json(batch);
//   } catch (err) {
//     console.error("Error creating batch:", err);
//     res.status(500).json({ message: "Failed to create batch", error: err });
//   }
// };

// Update a batch
/*export const updateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const updated = await Batch.findByIdAndUpdate(batchId, req.body, { new: true });

    if (!updated) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update batch", error: err });
  }
};*/

// Delete a batch
export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Batch.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete batch:", err);
    res.status(500).json({ message: "Failed to delete batch", error: err });
  }
};

// Delete a batch and remove references
// export const deleteBatchAndRelated = async (req: Request, res: Response) => {
//   try {
//     const { batchId } = req.params;

//     await Batch.findByIdAndDelete(batchId);

//     await Course.updateMany(
//       { batches: batchId },
//       { $pull: { batches: batchId } }
//     );

//     await User.updateMany(
//       { role: "teacher", batches: batchId },
//       { $pull: { batches: batchId } }
//     );

//     // Optional cleanup: await Exam.deleteMany({ batch: batchId });
//     // Optional cleanup: await Flag.deleteMany({ batch: batchId });

//     res.status(200).json({ message: "Batch and related data deleted." });
//   } catch (error) {
//     res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
//   }
// };

// Create batch with instructor and optional TA
export const createBatchWithNames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchName, courseId, instructorId, taId, students } = req.body;

    if (!batchName || !courseId || !instructorId) {
      res.status(400).json({ message: "Batch name, course ID, and instructor ID are required." });
      return;
    }

    // Find course and instructor by ID
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found." });
      return;
    }

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "teacher") {
      res.status(404).json({ message: "Instructor not found or not a teacher." });
      return;
    }

    // If taId is provided, verify user
    let ta = null;
    if (taId) {
      ta = await User.findById(taId);
      if (!ta) {
        res.status(404).json({ message: "TA not found." });
        return;
      }
    }

    // Check for duplicate batch
    const existing = await Batch.findOne({ name: batchName, course: courseId });
    if (existing) {
      res.status(400).json({ message: "Batch name already exists for this course." });
      return;
    }

    // Create batch
    const batch = await Batch.create({
      name: batchName,
      course: courseId,
      instructor: instructorId,
      ta: taId ?? [], // <-- always set ta explicitly to an empty array if not provided
      students: students || [],
    });


    res.status(201).json({ message: "Batch created successfully", batch });
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ message: "Failed to create batch", error: err });
  }
};
