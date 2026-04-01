import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from '../../config/api';


export default function ChangePassword({ onClose }: { onClose: () => void }) {
    const token = localStorage.getItem("token");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(
                `${API_BASE_URL}/api/student/change-password`,
                {
                    currentPassword,
                    newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setMessage(res.data.message);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-purple-800">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                        type="password"
                        className="w-full border-2 px-4 py-2 rounded-xl"
                        placeholder="Current Password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        className="w-full border-2 px-4 py-2 rounded-xl"
                        placeholder="New Password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        className="w-full border-2 px-4 py-2 rounded-xl"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {message && <p className="text-green-600 text-sm">{message}</p>}

                    <div className="flex justify-between pt-2">
                        <button
                            type="submit"
                            className="bg-purple-700 text-white px-4 py-2 rounded-xl hover:bg-purple-800"
                            disabled={loading}
                        >
                            {loading ? "Changing..." : "Change Password"}
                        </button>
                        <button type="button" onClick={onClose} className="text-purple-600">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

