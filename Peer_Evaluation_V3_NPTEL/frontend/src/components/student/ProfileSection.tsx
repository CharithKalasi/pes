import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from '../../config/api';


interface StudentProfile {
  name: string;
  email: string;
  id?: string;
}

type Menu =
  | "dashboard"
  | "courses"
  | "enrollment"
  | "peerEvaluation"
  | "viewMarks"
  | "profile";

type Props = {
  darkMode: boolean;
  onNavigate?: (menu: Menu) => void;
};

const ProfileSection = ({ darkMode, onNavigate }: Props) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/student/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_BASE_URL}/api/student/change-password`,
        { currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(res.data.message || "Password updated");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to change password");
    }
  };

  if (loading)
    return (
      <div
        className={`max-w-2xl mx-auto mt-10 p-8 rounded-2xl shadow-md ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        }`}
      >
        <p className="text-center text-lg">Loading profile...</p>
      </div>
    );

  if (!profile)
    return (
      <div
        className={`max-w-2xl mx-auto mt-10 p-8 rounded-2xl shadow-md ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        }`}
      >
        <p className="text-center text-red-500 text-lg">
          Failed to load profile
        </p>
      </div>
    );

  return (
    <div
      className={`max-w-2xl mx-auto mt-10 p-8 rounded-2xl shadow-md space-y-6 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-indigo-600">
        My Profile
      </h2>

      <div className="space-y-4">
        <ProfileItem label="Name" value={profile.name} darkMode={darkMode} />
        <ProfileItem label="Email" value={profile.email} darkMode={darkMode} />
      </div>

      <hr className={`border-t my-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`} />

      {/* Navigation Button (NOW FIXED) */}
      <div className="flex justify-center">
        <button
          onClick={() => onNavigate?.("dashboard")}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-700 text-white"
        >
          Go to Dashboard
        </button>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h3 className="text-xl font-semibold">Change Password</h3>

        <input
          type="password"
          placeholder="Current Password"
          className={`w-full px-4 py-2 border rounded-xl ${
            darkMode
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New Password"
          className={`w-full px-4 py-2 border rounded-xl ${
            darkMode
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className={`w-full px-4 py-2 border rounded-xl ${
            darkMode
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-800 to-indigo-700 text-white py-2 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Update Password
        </button>

        {message && (
          <p className="text-center text-sm text-gray-400">{message}</p>
        )}
      </form>
    </div>
  );
};

const ProfileItem = ({
  label,
  value,
  darkMode,
}: {
  label: string;
  value: string;
  darkMode: boolean;
}) => (
  <div
    className={`flex items-center justify-between px-4 py-2 rounded-xl border ${
      darkMode
        ? "bg-gray-800 border-gray-700 text-white"
        : "bg-gray-50 border-gray-200 text-gray-800"
    }`}
  >
    <span className="font-medium">{label}:</span>
    <span>{value}</span>
  </div>
);

export default ProfileSection;
