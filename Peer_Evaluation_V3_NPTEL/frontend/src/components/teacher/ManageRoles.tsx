import { useState, useEffect } from "react";
import axios from "axios";
import { FiUserCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from '../../config/api';


const palette = {
  'bg-secondary': '#FFFAF2',
  'sidebar-bg': '#E6E6FA',
  'border-soft': '#F0E6EF',
  'text-dark': '#4B0082',
  'text-muted': '#A9A9A9',
  'text-sidebar-dark': '#4B0082',
};

const ManageRoles = () => {
  const [coursesWithBatches, setCoursesWithBatches] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [tas, setTAs] = useState<any[]>([]);
  const [showTAs, setShowTAs] = useState<boolean>(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/teacher/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        setCoursesWithBatches(res.data.courses);
      });
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;

    axios
      .get(`${API_BASE_URL}/api/teacher/ta-candidates/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setStudents(res.data.students));

    axios
      .get(`${API_BASE_URL}/api/teacher/batch/${selectedBatch}/ta`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setTAs(res.data.ta || []))
      .catch(() => setTAs([]));
  }, [selectedCourse]);

  const handleAssignTA = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/teacher/batch/${selectedBatch}/assign-ta`,
        { studentId: selectedStudent },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessage(res.data.message || "TA assigned successfully!");

      const taRes = await axios.get(
        `${API_BASE_URL}/api/teacher/batch/${selectedBatch}/ta`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setTAs(taRes.data.ta || []);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error assigning TA");
    }
  };

  const handleRemoveTA = async (taId: string) => {
    if (!selectedBatch || !taId) {
      setMessage("Invalid batch or TA");
      return;
    }

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/teacher/batch/${selectedBatch}/remove-ta/${taId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessage(res.data.message || "TA removed successfully");

      const taRes = await axios.get(
        `${API_BASE_URL}/api/teacher/batch/${selectedBatch}/ta`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setTAs(taRes.data.ta || []);
    } catch (err: any) {
      console.error("Failed to remove TA:", err);
      setMessage(err.response?.data?.message || "Failed to remove TA");
    }
  };

  return (
    <motion.div className="flex flex-col items-center justify-center w-full h-full pt-10 pb-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      <motion.div
        className="shadow-2xl rounded-3xl border px-10 py-12 max-w-lg w-full flex flex-col items-center relative"
        style={{
          backgroundColor: palette['bg-secondary'],
          borderColor: palette['border-soft'],
          boxShadow: `0 8px 25px rgba(128,0,128,0.08)`
        }}
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex justify-center">
          <div className="p-4 rounded-full shadow-lg" style={{ backgroundColor: palette['sidebar-bg'] }}>
            <FiUserCheck className="text-4xl" style={{ color: palette['text-sidebar-dark'] }} />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center drop-shadow mt-6" style={{ color: palette['text-dark'] }}>
          Manage TA Assignments
        </h2>
        <p className="mb-8 text-center text-base font-medium" style={{ color: palette['text-muted'] }}>
          Assign a student the role of Teaching Assistant for a batch.
        </p>

        <form className="flex flex-col gap-8 w-full" onSubmit={e => {
          e.preventDefault();
          handleAssignTA();
        }}>
          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold" style={{ color: palette['text-dark'] }}>Select Course & Batch</label>
            <select
              className="border-2 px-4 py-3 rounded-xl w-full shadow-md"
              style={{
                borderColor: palette['border-soft'],
                backgroundColor: "#FFFFFF",
                color: palette['text-dark'],
                outlineColor: palette['sidebar-bg'],
              }}
              onChange={(e) => {
                const [courseId, batchId] = e.target.value.split("|");
                setSelectedCourse(courseId);
                setSelectedBatch(batchId);
                setStudents([]);
                setTAs([]);
              }}
              value={selectedBatch ? `${selectedCourse}|${selectedBatch}` : ""}
              required
            >
              <option value="">-- Select Course & Batch --</option>
              {coursesWithBatches.flatMap((course) =>
                course.batches.map((batch: any) => (
                  <option key={batch._id} value={`${course._id}|${batch._id}`}>
                    {course.name} ({course.code}) - {batch.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {tas.length > 0 && (
            <div className="flex flex-col gap-2 w-full">
              <label className="font-semibold" style={{ color: palette['text-dark'] }}>Assigned TA{tas.length > 1 ? "s" : ""}</label>
              <button type="button" onClick={() => setShowTAs(!showTAs)} className="text-sm underline text-purple-700 hover:text-purple-900 text-left">
                {showTAs ? "Hide TA list" : `View ${tas.length} TA${tas.length > 1 ? "s" : ""}`}
              </button>
              <AnimatePresence>
                {showTAs && (
                  <motion.ul className="bg-white border-2 rounded-xl p-4 shadow-inner mt-2 space-y-2" style={{ borderColor: palette["border-soft"] }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    {tas.map((ta, index) => (
                      <li key={index} className="text-sm text-purple-800 flex justify-between items-center">
                        {ta.name} ({ta.email})
                        <button
                          type="button"
                          onClick={() => handleRemoveTA(ta._id)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {students.length > 0 && (
            <div className="flex flex-col gap-2 w-full">
              <label className="font-semibold" style={{ color: palette['text-dark'] }}>Select Student</label>
              <select className="border-2 px-4 py-3 rounded-xl w-full shadow-md" style={{ borderColor: palette['border-soft'], backgroundColor: "#FFFFFF", color: palette['text-dark'], outlineColor: palette['sidebar-bg'] }} value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
                <option value="">-- Select Student --</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <motion.button type="submit" disabled={!selectedStudent} className="px-6 py-3 rounded-xl font-semibold text-white shadow-md disabled:opacity-50" style={{ backgroundColor: palette['sidebar-bg'], color: palette['text-sidebar-dark'], boxShadow: `0 4px 15px ${palette['sidebar-bg']}40` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
            Assign TA Role
          </motion.button>

          <AnimatePresence>
            {message && (
              <motion.div className="text-center font-medium mt-2" style={{ color: palette['text-muted'] }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ManageRoles;
