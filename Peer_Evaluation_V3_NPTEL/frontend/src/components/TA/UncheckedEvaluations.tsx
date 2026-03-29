import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiDownload, FiEdit, FiSave, FiX, FiFileText } from 'react-icons/fi';

interface UncheckedTicket {
  _id: string; // This is the ticket ID
  evaluationId: string; // This is the evaluation ID
  evaluatee: {
    _id: string;
    name: string;
    email: string;
  };
  evaluator: {
    _id: string;
    name: string;
    email: string;
  };
  exam: {
    _id: string;
    title: string;
    numQuestions: number;
    answerKeyPdf?: string;
    answerKeyMimeType?: string;
    course: {
      name: string;
      code: string;
    };
  };
  marks: number[];
  feedback?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface UncheckedEvaluationsProps {
  currentPalette: Record<string, string>;
  commonCardClasses: string;
  getCardStyles: () => React.CSSProperties;
}

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const UncheckedEvaluations: React.FC<UncheckedEvaluationsProps> = React.memo(({
  currentPalette,
  commonCardClasses,
  getCardStyles,
}) => {
  const [uncheckedTickets, setUncheckedTickets] = useState<UncheckedTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<{
    id: string;
    marks: number[];
    feedback: string;
  } | null>(null);

  const token = localStorage.getItem('token');

  // Memoize button styles to prevent recreation on every render
  const commonButtonClasses = useMemo(() => `
    px-6 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md active:scale-95 transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `, []);
  
  const getButtonStyles = useCallback((
    colorKey: keyof typeof currentPalette, 
    textColorKey: keyof typeof currentPalette = 'text-dark'
  ) => ({
    backgroundColor: currentPalette[colorKey],
    color: currentPalette[textColorKey],
    boxShadow: `0 4px 15px ${currentPalette[colorKey]}40`,
  }), [currentPalette]);

  const fetchUncheckedTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:${PORT}/api/ta/unchecked-evaluations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unchecked evaluation tickets');
      }

      const data = await response.json();
      setUncheckedTickets(data.uncheckedEvaluations || []);
    } catch (err) {
      console.error('Error fetching unchecked evaluation tickets:', err);
      setError('Failed to fetch unchecked evaluation tickets.');
      setUncheckedTickets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUncheckedTickets();
  }, [fetchUncheckedTickets]);

  const handleDownloadSubmission = useCallback(async (ticket: UncheckedTicket) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/ta/unchecked-submission/${ticket._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download submission');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `submission_${ticket.evaluatee.name}_${ticket.exam.title}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading submission:', err);
      setError('Failed to download submission. Please try again.');
    }
  }, [token]);

  const handleDownloadAnswerKey = useCallback(async (ticket: UncheckedTicket) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/ta/unchecked-answer-key/${ticket._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Answer key not found for this exam.');
        } else {
          throw new Error('Failed to download answer key');
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `answer_key_${ticket.exam.title}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading answer key:', err);
      setError('Failed to download answer key. Please try again.');
    }
  }, [token]);

  const handleStartEvaluation = useCallback((ticket: UncheckedTicket) => {
    const numQuestions = ticket.exam.numQuestions || 5;
    const initialMarks = Array(numQuestions).fill(0);
    
    setEditingTicket({
      id: ticket._id,
      marks: initialMarks,
      feedback: ''
    });
  }, []);

  // Optimize the handleMarkChange function to prevent recreating the entire object
  const handleMarkChange = useCallback((index: number, value: string) => {
    if (!editingTicket) return;
    
    setEditingTicket(prev => {
      if (!prev) return prev;
      const updatedMarks = [...prev.marks];
      updatedMarks[index] = Number(value);
      
      return {
        ...prev,
        marks: updatedMarks
      };
    });
  }, [editingTicket?.id]); // Only depend on the ticket ID, not the entire object

  // Optimize the feedback change handler
  const handleFeedbackChange = useCallback((value: string) => {
    setEditingTicket(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        feedback: value
      };
    });
  }, []);

  const handleSaveEvaluation = useCallback(async () => {
    if (!editingTicket) return;

    try {
      setLoading(true);

      const invalidMarks = editingTicket.marks.some(mark =>
        isNaN(mark) || mark < 0 || mark > 20
      );

      if (invalidMarks) {
        setError("Please enter valid marks between 0 and 20 for all questions");
        return;
      }

      const response = await fetch(`http://localhost:${PORT}/api/ta/complete-evaluation/${editingTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marks: editingTicket.marks,
          feedback: editingTicket.feedback
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete evaluation');
      }

      setSuccessMessage('Unchecked evaluation completed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setEditingTicket(null);
      fetchUncheckedTickets(); // Refresh the list
    } catch (err) {
      console.error('Error completing evaluation:', err);
      setError('Failed to complete evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [editingTicket, token, fetchUncheckedTickets]);

  const handleCancelEdit = useCallback(() => {
    setEditingTicket(null);
  }, []);

  if (loading && !editingTicket) {
    return (
      <div className="flex flex-col items-center justify-start w-full h-full pt-10 pb-4">
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: currentPalette['accent-purple'] }}>
          Unchecked Evaluations
        </h2>
        <div className="w-full max-w-4xl">
          <div className={commonCardClasses} style={getCardStyles()}>
            <div className="flex justify-center py-6">
              <div
                className="animate-spin rounded-full h-10 w-10 border-b-2"
                style={{ borderColor: currentPalette['accent-purple'] }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-full h-full pt-10 pb-4">
      <h2 className="text-3xl font-bold text-center mb-8" style={{ color: currentPalette['accent-purple'] }}>
        Unchecked Evaluations
      </h2>

      {error && (
        <div className="border px-4 py-3 rounded-lg mb-4 w-full max-w-4xl"
             style={{ backgroundColor: currentPalette['accent-pink'] + '10', borderColor: currentPalette['accent-pink'] + '40', color: currentPalette['accent-pink'] + '90' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="border px-4 py-3 rounded-lg mb-4 w-full max-w-4xl"
             style={{ backgroundColor: currentPalette['accent-light-purple'] + '10', borderColor: currentPalette['accent-light-purple'] + '40', color: currentPalette['accent-purple'] + '90' }}>
          {successMessage}
        </div>
      )}

      <div className="w-full max-w-4xl">
        {uncheckedTickets.length === 0 ? (
          <div className={commonCardClasses} style={getCardStyles()}>
            <p className="text-center" style={{ color: currentPalette['text-muted'] }}>
              No unchecked evaluation tickets at the moment.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {uncheckedTickets.map((ticket) => (
              <li key={ticket._id} className={commonCardClasses} style={getCardStyles()}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p style={{ color: currentPalette['text-muted'] }}>Student (Evaluatee):</p>
                    <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>
                      {ticket.evaluatee.name}
                    </p>
                    <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                      {ticket.evaluatee.email}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: currentPalette['text-muted'] }}>Evaluator:</p>
                    <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>
                      {ticket.evaluator.name}
                    </p>
                    <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                      {ticket.evaluator.email}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: currentPalette['text-muted'] }}>Exam:</p>
                    <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>
                      {ticket.exam.title}
                    </p>
                    <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                      Course: {ticket.exam.course.name}
                    </p>
                    <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                      Questions: {ticket.exam.numQuestions}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p style={{ color: currentPalette['text-muted'] }}>Ticket Created:</p>
                  <p className="text-sm" style={{ color: currentPalette['text-dark'] }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {editingTicket?.id === ticket._id ? (
                  <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: currentPalette['accent-light-yellow'] + '20' }}>
                    <h4 className="font-semibold mb-4" style={{ color: currentPalette['text-dark'] }}>
                      Grade Evaluation
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {editingTicket.marks.map((mark, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium mb-1" style={{ color: currentPalette['text-dark'] }}>
                            Question {index + 1} (0-20):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={mark}
                            onChange={(e) => handleMarkChange(index, e.target.value)}
                            className="w-full border rounded-lg p-2"
                            style={{
                              backgroundColor: currentPalette['bg-secondary'],
                              borderColor: currentPalette['border-soft'],
                              color: currentPalette['text-dark']
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1" style={{ color: currentPalette['text-dark'] }}>
                        Feedback (Optional):
                      </label>
                      <textarea
                        value={editingTicket.feedback}
                        onChange={(e) => handleFeedbackChange(e.target.value)}
                        rows={3}
                        className="w-full border rounded-lg p-2"
                        style={{
                          backgroundColor: currentPalette['bg-secondary'],
                          borderColor: currentPalette['border-soft'],
                          color: currentPalette['text-dark']
                        }}
                        placeholder="Add feedback for this evaluation..."
                      />
                    </div>

                    <div className="text-right mb-4">
                      <strong style={{ color: currentPalette['text-dark'] }}>
                        Total: {editingTicket.marks.reduce((sum, mark) => sum + mark, 0)} / {ticket.exam.numQuestions * 20}
                      </strong>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={handleCancelEdit}
                        className={`${commonButtonClasses} flex items-center gap-2`}
                        style={getButtonStyles('text-muted', 'text-dark')}
                      >
                        <FiX /> Cancel
                      </button>
                      <button
                        onClick={handleSaveEvaluation}
                        className={`${commonButtonClasses} flex items-center gap-2`}
                        style={getButtonStyles('accent-purple', 'white')}
                        disabled={loading}
                      >
                        <FiSave /> {loading ? 'Saving...' : 'Complete Evaluation'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => handleDownloadSubmission(ticket)}
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: currentPalette['accent-lilac'] }}
                    >
                      <FiDownload /> Download Submission
                    </button>
                    <button
                      onClick={() => handleDownloadAnswerKey(ticket)}
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: currentPalette['accent-pink'] }}
                    >
                      <FiFileText /> Download Answer Key
                    </button>
                    <button
                      onClick={() => handleStartEvaluation(ticket)}
                      className={`${commonButtonClasses} flex items-center gap-2`}
                      style={getButtonStyles('accent-purple', 'white')}
                    >
                      <FiEdit /> Start Evaluation
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

UncheckedEvaluations.displayName = 'UncheckedEvaluations';

export default UncheckedEvaluations;
