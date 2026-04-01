// frontend/src/components/teacher/TeacherHome.tsx
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FiBook, FiEdit, FiUsers } from "react-icons/fi";
import { useState } from "react";
import { API_BASE_URL } from '../../config/api';


const lightPalette = {
  'sidebar-bg': '#E6E6FA',
  'shadow-medium': 'rgba(128, 0, 128, 0.08)',
  'text-sidebar-dark': '#4B0082',
};

const AnimatedCount = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useState(() => {
    let start = 0;
    const end = value;
    const increment = end > start ? 1 : 0;
    const timer = setInterval(() => {
      start += increment;
      setDisplay(start);
      if (start === end) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  });
  return <span>{display}</span>;
};

const fetchDashboardStats = async () => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/teacher/dashboard-stats`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return data;
};

const TeacherHome = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["teacherDashboardStats"],
    queryFn: fetchDashboardStats,
  });

  const commonCardClasses = `
    rounded-3xl p-8 text-white flex flex-col justify-center items-center h-48 relative
    hover:shadow-xl transform hover:translate-y-[-4px] transition-all duration-300
  `;

  if (isLoading) return <div>Loading dashboard stats...</div>;
  if (error) return <div>Error loading dashboard stats</div>;

  const stats = [
    {
      icon: FiBook,
      label: "Courses",
      count: data.coursesCount,
      bgColor: lightPalette["sidebar-bg"],
    },
    {
      icon: FiUsers,
      label: "Batches",
      count: data.batchesCount,
      bgColor: lightPalette["sidebar-bg"],
    },
    {
      icon: FiEdit,
      label: "Exams",
      count: data.examsCount,
      bgColor: lightPalette["sidebar-bg"],
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start w-full h-full pt-10 pb-4">
      <h1 className="text-4xl font-extrabold mb-4 text-center drop-shadow" style={{ color: lightPalette['text-sidebar-dark'] }}>
        Welcome, Teacher!
      </h1>
      <p className="text-base" style={{ color: "#A9A9A9" }}>
        Make teaching easier – manage your courses, batches, and exams from one place.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 mt-10 w-full max-w-5xl">
        {stats.map((c) => (
          <div
            key={c.label}
            className={commonCardClasses}
            style={{
              backgroundColor: c.bgColor,
              boxShadow: `0 8px 20px ${lightPalette['shadow-medium']}`,
              color: lightPalette['text-sidebar-dark']
            }}
          >
            <span className="absolute top-4 right-4 rounded-full p-1" style={{ backgroundColor: "#ffffff20" }}>
              <c.icon className="text-4xl drop-shadow-lg" />
            </span>
            <h3 className="text-xl font-bold mt-6 mb-1">{c.label}</h3>
            <p className="text-5xl font-extrabold tracking-wider drop-shadow-lg">
              <AnimatedCount value={c.count} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherHome;

