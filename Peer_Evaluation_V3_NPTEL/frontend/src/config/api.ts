const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

// Vercel injects the production backend URL here; localhost remains the local fallback.
export const API_BASE_URL = rawApiUrl?.replace(/\/+$/, "") || "http://localhost:5000";
