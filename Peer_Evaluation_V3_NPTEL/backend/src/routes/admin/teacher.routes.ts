import express from 'express';
import type { RequestHandler } from 'express';
import { authMiddleware } from "../../middlewares/authMiddleware.ts";      
import { authorizeRoles } from "../../middlewares/authorizeRoles.ts";
import {
  //createTeacher,
  getAllTeachers,
  //getTeacherById,
  //updateTeacher,
  deleteTeacher,
  assignTeacherToCourse,
  unassignTeacherFromCourse
} from '../../controllers/admin/teacher.controller.ts';

const router = express.Router();

//router.post('/',authMiddleware,authorizeRoles("admin"), createTeacher);
router.get('/',authMiddleware,authorizeRoles("admin"), getAllTeachers);
//router.get('/:id',authMiddleware,authorizeRoles("admin"), getTeacherById as RequestHandler);
router.put('/assign-course',authMiddleware,authorizeRoles('admin'),assignTeacherToCourse);
router.put('/unassign-course',authMiddleware,authorizeRoles('admin'),unassignTeacherFromCourse);
//router.put('/:id',authMiddleware,authorizeRoles("admin"), updateTeacher as RequestHandler);
router.delete('/email/:email',authMiddleware,authorizeRoles("admin"), deleteTeacher as RequestHandler);
export default router;
