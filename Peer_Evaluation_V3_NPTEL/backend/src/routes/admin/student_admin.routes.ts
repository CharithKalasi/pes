import express from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import { authMiddleware } from "../../middlewares/authMiddleware.ts";      
import { authorizeRoles } from "../../middlewares/authorizeRoles.ts";     

import {
  getAllStudents,
  //getStudentById,
  //createStudent,
  //updateStudent,
  deleteStudent,
  assignStudentToCourse,
  unassignStudentFromCourse
} from '../../controllers/admin/student.controller.ts';


const router = express.Router();

router.get('/', authMiddleware,authorizeRoles("admin"), catchAsync(getAllStudents));
router.put('/assign-course', authMiddleware, authorizeRoles('admin'), assignStudentToCourse);
router.put('/unassign-course', authMiddleware, authorizeRoles('admin'), unassignStudentFromCourse);
//router.get('/:id', authMiddleware,authorizeRoles("admin"), catchAsync(getStudentById));
//router.post('/',  authMiddleware,authorizeRoles("admin"),catchAsync(createStudent));
//router.put('/:id',  authMiddleware,authorizeRoles("admin"),catchAsync(updateStudent));
router.delete('/email/:email',  authMiddleware,authorizeRoles("admin"),catchAsync(deleteStudent));

export default router;
