import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FiArrowLeft, FiMail, FiMoon, FiRefreshCw, FiShield, FiSun } from "react-icons/fi";
import axios, { AxiosError } from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const palette = {
  accentPurple: "#7c3aed",
  accentLilac: "#c4b5fd",
};

type OtpState = {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
};

type DialogBoxProps = {
  show: boolean;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

function DialogBox({ show, message, type = "success", onClose }: DialogBoxProps) {
  if (!show) return null;

  const icon =
    type === "success" ? (
      <svg width={56} height={56} fill="none" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="28" fill="#6ddf99" />
        <path d="M18 30l7 7 13-13" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f87171" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="animate-fadein flex min-w-[320px] max-w-md flex-col items-center rounded-2xl bg-white px-8 py-8 shadow-xl">
        <div className="mb-2">{icon}</div>
        <div className={`mb-1 text-center text-lg font-semibold ${type === "success" ? "text-[#235d3a]" : "text-red-600"}`}>
          {message}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-3xl bg-purple-700 px-4 py-2 text-white">
          OK
        </button>
      </div>
    </div>
  );
}

export default function OtpScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email = "", password = "", role = "student", name = "" } = (location.state as OtpState | null) ?? {};

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const [darkMode, setDarkMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [countdown, setCountdown] = useState(30);

  const toggleButtonStyle = {
    backgroundColor: darkMode ? palette.accentPurple : palette.accentLilac,
    color: "white",
    boxShadow: darkMode
      ? `0 4px 15px ${palette.accentPurple}60`
      : `0 4px 15px ${palette.accentLilac}60`,
    ["--tw-ring-color"]: darkMode
      ? `${palette.accentPurple}70`
      : `${palette.accentLilac}70`,
  } as CSSProperties & Record<"--tw-ring-color", string>;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!normalizedEmail || !password || !name) {
      navigate("/register", { replace: true });
    }
  }, [navigate, normalizedEmail, password, name]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    setMsgContent(message);
    setMsgType(type);
    setShowMsg(true);
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      showMessage("Please enter the 6-digit OTP.", "error");
      return;
    }

    try {
      setIsVerifying(true);

      await axios.post(`http://localhost:${PORT}/api/auth/verify`, {
        email: normalizedEmail,
        otp: otp.trim(),
      });

      const response = await axios.post(`http://localhost:${PORT}/api/auth/register`, {
        name,
        email: normalizedEmail,
        password,
        role,
      });

      const { token, role: registeredRole, user, isTA } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", registeredRole);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("isTA", isTA ? "true" : "false");

      if (registeredRole === "admin") navigate("/admin");
      else if (registeredRole === "teacher") navigate("/teacher");
      else if (registeredRole === "ta" || isTA) navigate("/ta");
      else navigate("/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ message?: string; error?: string }>;
      showMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "OTP verification failed",
        "error"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await axios.post(`http://localhost:${PORT}/api/auth/send`, { email: normalizedEmail });
      setCountdown(30);
      showMessage("A fresh OTP has been sent to your email.");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showMessage(error.response?.data?.message || "Failed to resend OTP", "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-[Poppins] transition-colors duration-500 ${
        darkMode ? "dark bg-slate-900" : "bg-gradient-to-br from-pink-100 to-purple-200"
      }`}
    >
      <DialogBox show={showMsg} message={msgContent} type={msgType} onClose={() => setShowMsg(false)} />

      <div className="absolute -left-20 -top-20 h-72 w-72 animate-blob rounded-full bg-pink-300 opacity-30 mix-blend-multiply blur-2xl filter dark:bg-pink-800" />
      <div className="animation-delay-2000 absolute -bottom-20 -right-10 h-72 w-72 animate-blob rounded-full bg-purple-300 opacity-30 mix-blend-multiply blur-2xl filter dark:bg-purple-800" />

      <Link
        to="/"
        className="absolute left-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-800"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-5h-6v5H4a1 1 0 0 1-1-1V10.5z" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </Link>

      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border bg-white p-10 shadow-2xl backdrop-blur-md transition duration-300 ease-in-out hover:scale-105 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={() => navigate("/register")}
            className="mb-6 flex items-center gap-2 text-sm text-purple-600 hover:underline"
          >
            <FiArrowLeft />
            Back to Register
          </button>

          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500 text-3xl text-white shadow-lg">
              <FiShield />
            </div>
          </div>

          <h2 className="mb-3 text-center text-3xl font-extrabold text-gray-800 dark:text-white">
            Verify Your Email
          </h2>
          <p className="mb-8 text-center text-sm leading-6 text-gray-600 dark:text-gray-300">
            We sent a 6-digit code to
            <span className="mt-1 block break-all font-semibold text-purple-700 dark:text-purple-300">
              <FiMail className="mr-2 inline-block align-text-bottom" />
              {normalizedEmail}
            </span>
          </p>

          <form className="space-y-6" onSubmit={handleVerify}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="otp">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="otp-input-field w-full text-center text-2xl tracking-[0.5em]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full rounded-lg py-3 text-black shadow-md transition hover:bg-purple-600 ${
                isVerifying ? "cursor-not-allowed opacity-50" : "transform hover:scale-105"
              } !bg-purple-500`}
            >
              {isVerifying ? "Verifying..." : "Verify and Create Account"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-purple-50 p-4 text-sm text-gray-700 dark:bg-slate-800 dark:text-gray-200">
            <p className="font-medium">Didn't get the code?</p>
            <p className="mt-1">Check spam, then request a fresh OTP if needed.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold ${
                countdown > 0 || isResending
                  ? "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-200"
              }`}
            >
              <FiRefreshCw className={isResending ? "animate-spin" : ""} />
              {isResending ? "Resending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Wrong email? <Link to="/register" className="font-semibold text-purple-600 hover:underline">Start again</Link>
          </p>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={toggleButtonStyle}
        >
          {darkMode ? <FiMoon className="h-6 w-6" /> : <FiSun className="h-6 w-6" />}
        </button>
      </div>

      <style>{`
        .animate-blob {
          animation: blob 7s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .otp-input-field {
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          background: white;
          padding: 0.9rem 1.25rem;
          transition: 0.3s ease;
        }
        .otp-input-field:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }
        .dark .otp-input-field {
          background-color: #1f2937;
          color: white;
          border-color: #374151;
        }
      `}</style>
    </div>
  );
}
