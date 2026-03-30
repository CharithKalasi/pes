import { Batch } from "../models/Batch.ts";
import type { IUser } from "../models/User.ts";
import { User } from "../models/User.ts";
import { sendReminderEmail } from "./email.ts";

export const sendBatchReminderEmails = async (
  batchId: string,
  subject: string,
  message: string
) => {
  try {
    const batch = await Batch.findById(batchId).populate(
      "students",
      "email name"
    );
    if (!batch) throw new Error("Batch not found");

    // 👇 Correct type assertion
    const students = batch.students as unknown as IUser[];

    for (const student of students) {
      if (student.email) {
        await sendReminderEmail(
          student.email,
          subject,
          message.replace("{{name}}", student.name)
        );
      }
    }

    console.log(
      `Email sent to ${students.length} student(s) in batch ${batch.name}`
    );
  } catch (err) {
    console.error("Failed to send batch reminder:", err);
  }
};

// Send Emails to TAs when assigned to a batch
export const sendTAAssignmentEmails = async (
  studentId: String,
  batchId: String
) => {
  try {
    const student = await User.findById(studentId);
    const batch = await Batch.findById(batchId);
    if (!student) {
      console.error("Student not found");
      return;
    }
    if (!batch) {
      console.error("Batch not found");
      return;
    }
    if (!student.email) return;

    const subject = "TA Assignment Notification";
    const message = `Dear ${student.name},\n\nYou have been assigned as a Teaching Assistant for the batch "${batch.name}".\nPlease log in to your dashboard for details.\n\nRegards,\n\nPES Team`;

    await sendReminderEmail(student.email, subject, message);
    console.log(`TA assignment email sent to ${student.name}`);
  } catch (err) {
    console.error("Error sending TA assignment emails:", err);
  }
};
