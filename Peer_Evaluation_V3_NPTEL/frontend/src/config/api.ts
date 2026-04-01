const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = rawApiUrl?.replace(/\/+$/, "") || "http://localhost:5000";
