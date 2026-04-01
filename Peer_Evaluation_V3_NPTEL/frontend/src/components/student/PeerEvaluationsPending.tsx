import { useEffect, useState } from "react";
import axios from "axios";
import { FaRegSmileBeam, FaRegPaperPlane } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { PiExam } from "react-icons/pi";
import { API_BASE_URL } from '../../config/api';


type Props = {
  darkMode: boolean;
};

interface Evaluation {
  _id: string;
  exam: {
    _id: string;
    title: string;
    numQuestions: number;
    maxMarks: number[];
    questions: string[];
  };
  submissionId: string | null;
  pdfUrl: string | null;
  answerKeyUrl?: string | null;
}

const pastelColors = [
  "bg-gradient-to-br from-blue-100 to-blue-50",
  "bg-gradient-to-br from-purple-100 to-purple-50",
  "bg-gradient-to-br from-pink-100 to-pink-50",
  "bg-gradient-to-br from-yellow-100 to-yellow-50",
  "bg-gradient-to-br from-green-100 to-green-50",
  "bg-gradient-to-br from-orange-100 to-orange-50",
];

const PeerEvaluationsPending = ({ darkMode }: Props) => {
  const [pending, setPending] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEval, setOpenEval] = useState<Evaluation | null>(null);
  const [marks, setMarks] = useState<(number | '')[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [markErrors, setMarkErrors] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [answerKeyUrl, setAnswerKeyUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/student/pending-evaluations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPending(res.data.evaluations || []);
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.message || "Failed to fetch pending evaluations");
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const openEvaluation = async (ev: Evaluation) => {
    setOpenEval(ev);
    setMarks(Array(ev.exam.numQuestions).fill(""));
    setFeedback("");
    setSubmitStatus("idle");
    setMarkErrors(Array(ev.exam.numQuestions).fill(""));
    setPdfUrl(null);
    setAnswerKeyUrl(null);

    const token = localStorage.getItem("token");

    if (ev.submissionId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/submission-pdf/${ev.submissionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          setPdfUrl(URL.createObjectURL(blob));
        }
      } catch { }
    }

    if (ev.answerKeyUrl) {
      try {
        const res = await fetch(ev.answerKeyUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          setAnswerKeyUrl(URL.createObjectURL(blob));
        }
      } catch { }
    }
  };

  const handleMarkChange = (idx: number, value: string) => {
    const newMarks = [...marks];
    const newErrors = [...markErrors];
    if (value === "") {
      newMarks[idx] = "";
      newErrors[idx] = "Please enter a value";
    } else {
      const num = Number(value);
      newMarks[idx] = num;
      if (openEval && num > openEval.exam.maxMarks[idx]) {
        newErrors[idx] = "Value greater than max marks";
      } else if (num < 0) {
        newErrors[idx] = "Value cannot be negative";
      } else {
        newErrors[idx] = "";
      }
    }
    setMarks(newMarks);
    setMarkErrors(newErrors);
  };

  const isSubmitDisabled =
    submitStatus === "submitting" ||
    !openEval ||
    marks.length !== openEval.exam.numQuestions ||
    marks.some(m => m === "" || typeof m !== "number") ||
    markErrors.some(e => e);

  const handleCloseModal = () => {
    setOpenEval(null);
    setMarks([]);
    setFeedback("");
    setSubmitStatus("idle");
    setMarkErrors([]);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    if (answerKeyUrl) URL.revokeObjectURL(answerKeyUrl);
    setPdfUrl(null);
    setAnswerKeyUrl(null);
  };

  const handleSubmit = async () => {
    if (!openEval || isSubmitDisabled) return;
    setSubmitStatus("submitting");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/student/submit-peer-evaluation`, {
        evaluationId: openEval._id,
        marks: marks.map(m => m === "" ? 0 : m),
        feedback,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmitStatus("success");
      setPending(prev => prev.filter(ev => ev._id !== openEval._id));
      handleCloseModal();
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <div className={`p-10 w-full max-w-5xl space-y-8 relative ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center gap-3 mb-4">
        <FaRegSmileBeam className="text-4xl text-blue-400" />
        <h2 className="text-3xl font-bold">Pending Peer Evaluations</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center">
          <BsStars className="text-5xl text-blue-400 animate-spin mb-4" />
          <div className="rounded-2xl shadow p-6 text-lg font-semibold bg-opacity-50">
            Loading your pending evaluations...
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center">
          <div className="rounded-2xl shadow p-6 text-red-500 font-semibold bg-opacity-50">
            {error}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pending.map((ev, i) => (
            <div key={ev._id} className={`rounded-2xl shadow p-6 border hover:shadow-xl transition relative ${darkMode ? 'bg-gray-800 border-gray-700' : pastelColors[i % pastelColors.length]}`}>
              <div className="absolute -top-5 -right-5">
                <PiExam className="text-5xl text-blue-200 opacity-60" />
              </div>
              <div>
                <div className="font-semibold text-xl mb-2 flex items-center gap-2">
                  <BsStars className="text-blue-400" /> {ev.exam.title}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Questions:</span> {ev.exam.numQuestions}
                </div>
              </div>
              <button
                className="mt-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-purple-500 transition font-bold shadow"
                onClick={() => openEvaluation(ev)}
              >
                Start Evaluation
              </button>
            </div>
          ))}
        </div>
      )}

      {openEval && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center ${darkMode ? 'bg-black/80' : 'bg-white/40'}`}>
          <div className={`rounded-2xl shadow-xl w-[90vw] max-h-[90vh] overflow-auto p-6 flex gap-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
            <div className="w-3/5 h-[650px] grid grid-cols-2 gap-2">
              <div className="border rounded-xl overflow-hidden relative">
                <div className="text-xs text-center py-1 font-semibold bg-gray-100 dark:bg-gray-800">Student Submission</div>
                {pdfUrl ? (
                  <iframe src={pdfUrl} title="Student PDF" className="w-full h-full" />
                ) : (
                  <div className="text-gray-500 p-4">No submission available</div>
                )}
              </div>
              <div className="border rounded-xl overflow-hidden relative">
                <div className="text-xs text-center py-1 font-semibold bg-gray-100 dark:bg-gray-800">Answer Key</div>
                {answerKeyUrl ? (
                  <iframe src={answerKeyUrl} title="Answer Key" className="w-full h-full" />
                ) : (
                  <div className="text-gray-500 p-4">No answer key available</div>
                )}
              </div>
            </div>

            <div className="w-2/5 space-y-4">
              <h3 className="text-2xl font-bold text-indigo-500">Evaluate: {openEval.exam.title}</h3>
              {Array.from({ length: openEval.exam.numQuestions }).map((_, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block font-medium">Q{idx + 1} (Max: {openEval.exam.maxMarks[idx]})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border rounded-xl bg-white text-black"
                    value={marks[idx]}
                    onChange={(e) => handleMarkChange(idx, e.target.value)}
                    placeholder="Enter marks"
                    min={0}
                    max={openEval.exam.maxMarks[idx]}
                  />
                  {markErrors[idx] && (
                    <p className="text-red-500 text-sm">{markErrors[idx]}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1">
                <label className="block font-medium">Feedback</label>
                <textarea
                  className={`w-full px-4 py-2 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${darkMode ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400' : 'bg-white text-black border-gray-300 placeholder-gray-500'}`}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback for your peer"
                  rows={4}
                />
              </div>
              <div className="flex flex-wrap gap-4 justify-end mt-6">
                <button
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 ${isSubmitDisabled ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  <FaRegPaperPlane /> Submit Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerEvaluationsPending;

