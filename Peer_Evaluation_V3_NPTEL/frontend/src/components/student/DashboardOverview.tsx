import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

interface DashboardOverviewProps {
  darkMode: boolean;
}


const DashboardOverview: React.FC<DashboardOverviewProps> = ({ darkMode }) => {
  const token = localStorage.getItem('token');

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['upcomingExams'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/api/student/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data?.exams || [];
    },
  });

  const { data: evaluations = [], isLoading: evalsLoading } = useQuery({
    queryKey: ['pendingEvaluations'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/api/student/pending-evaluations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data?.evaluations || data?.evaluatees || [];
    },
  });

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['evaluationResults'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/api/student/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data?.results || [];
    },
  });

  const palette = darkMode ? {
    background: '#16213E',
    card: '#1A1A2E',
    text: '#E0E0E0',
    muted: '#B0BEC5',
    border: '#3F51B5',
    shadow: 'rgba(0, 0, 0, 0.4)',
  } : {
    background: '#FFFBF6',
    card: '#FFFAF2',
    text: '#4B0082',
    muted: '#A9A9A9',
    border: '#F0E6EF',
    shadow: 'rgba(128, 0, 128, 0.08)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: palette.card,
    borderColor: palette.border,
    color: palette.text,
    boxShadow: `0 4px 20px ${palette.shadow}`,
  };

  const cardBeforeGradient = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';

  return (
    <div className="grid grid-cols-fill-minmax-300 gap-8 relative z-10 sm:grid-cols-1 sm:gap-5">
      {/* Upcoming Exams */}
      <div className="rounded-2xl p-8 border relative overflow-hidden transition-all duration-300 sm:p-5" style={cardStyle}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: cardBeforeGradient }}></div>
        <h3 className="mb-4 text-xl font-bold tracking-tight" style={{ color: palette.text }}>Upcoming Exams</h3>
        {examsLoading ? (
          <p style={{ color: palette.muted }}>Loading...</p>
        ) : exams.length === 0 ? (
          <p style={{ color: palette.muted }}>No upcoming exams</p>
        ) : (
          <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed" style={{ color: palette.muted }}>
            {exams.slice(0, 3).map((exam: any) => (
              <li key={exam._id}>
                {exam.title} - {new Date(exam.startTime).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Peer Evaluations */}
      <div className="rounded-2xl p-8 border relative overflow-hidden transition-all duration-300 sm:p-5" style={cardStyle}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: cardBeforeGradient }}></div>
        <h3 className="mb-4 text-xl font-bold tracking-tight" style={{ color: palette.text }}>Peer Evaluations</h3>
        {evalsLoading ? (
          <p style={{ color: palette.muted }}>Loading...</p>
        ) : (
          <p style={{ color: palette.muted }}>You have {evaluations.length} peer reviews pending.</p>
        )}
      </div>

      {/* Recent Grades */}
      <div className="rounded-2xl p-8 border relative overflow-hidden transition-all duration-300 sm:p-5" style={cardStyle}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: cardBeforeGradient }}></div>
        <h3 className="mb-4 text-xl font-bold tracking-tight" style={{ color: palette.text }}>Recent Grades</h3>
        {resultsLoading ? (
          <p style={{ color: palette.muted }}>Loading...</p>
        ) : results.length === 0 ? (
          <p style={{ color: palette.muted }}>No evaluation results available.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed" style={{ color: palette.muted }}>
            {results.slice(0, 3).map((r: any) => (
              <li key={r.exam._id}>
                {r.exam.courseName}: <span style={{ color: palette.text, fontWeight: 600 }}>{r.averageMarks}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

