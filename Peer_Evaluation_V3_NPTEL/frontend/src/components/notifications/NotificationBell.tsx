import { useEffect, useMemo, useRef, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import { API_BASE_URL } from '../../config/api';


type NotificationItem = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedResource?: {
    type?: string;
    id?: string;
  };
};

type NotificationPalette = {
  "bg-secondary": string;
  "text-dark": string;
  "text-muted": string;
  "accent-purple": string;
  "accent-lilac": string;
  "border-soft": string;
  "shadow-medium": string;
  "white"?: string;
};

type Props = {
  currentPalette: NotificationPalette;
};

const getRelativeTime = (dateString: string) => {
  const now = Date.now();
  const timestamp = new Date(dateString).getTime();
  const diffMs = timestamp - now;
  const diffMinutes = Math.round(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
};

export default function NotificationBell({ currentPalette }: Props) {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers,
      });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Keep bell passive if count polling fails.
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=10`, {
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full flex items-center justify-center shadow-md border-2 transition-all duration-200"
        style={{
          backgroundColor: currentPalette["bg-secondary"],
          color: currentPalette["accent-purple"],
          borderColor: currentPalette["accent-lilac"],
          boxShadow: `0 4px 14px ${currentPalette["shadow-medium"]}`,
        }}
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
            style={{
              backgroundColor: currentPalette["accent-purple"],
              color: currentPalette["white"] || "#FFFFFF",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-3xl overflow-hidden z-50"
          style={{
            backgroundColor: currentPalette["bg-secondary"],
            color: currentPalette["text-dark"],
            border: `1px solid ${currentPalette["border-soft"]}`,
            boxShadow: `0 14px 32px ${currentPalette["shadow-medium"]}`,
          }}
        >
          <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: currentPalette["border-soft"] }}>
            <div>
              <h3 className="text-lg font-bold">Notifications</h3>
              <p className="text-sm" style={{ color: currentPalette["text-muted"] }}>
                {unreadCount} unread
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="text-sm font-semibold px-3 py-2 rounded-full transition"
              style={{
                backgroundColor: currentPalette["accent-lilac"],
                color: currentPalette["accent-purple"],
              }}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm" style={{ color: currentPalette["text-muted"] }}>
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm" style={{ color: currentPalette["text-muted"] }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="px-4 py-4 border-b transition-colors"
                  style={{
                    borderColor: currentPalette["border-soft"],
                    backgroundColor: notification.read
                      ? "transparent"
                      : `${currentPalette["accent-lilac"]}18`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => !notification.read && markAsRead(notification._id)}>
                      <p className="text-sm leading-6">{notification.message}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: currentPalette["text-muted"] }}>
                        <span>{getRelativeTime(notification.createdAt)}</span>
                        {notification.relatedResource?.type && (
                          <span className="px-2 py-1 rounded-full" style={{ backgroundColor: `${currentPalette["accent-lilac"]}22` }}>
                            {notification.relatedResource.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read ? (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 rounded-full"
                        style={{ color: currentPalette["accent-purple"] }}
                        title="Mark as read"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <span style={{ color: currentPalette["text-muted"] }} title="Read">
                        <FiCheckCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

