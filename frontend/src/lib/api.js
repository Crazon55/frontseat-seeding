import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const PREVIEW_KEY = "preview_as_email";

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("session_token");
  if (t && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  const previewEmail = localStorage.getItem(PREVIEW_KEY);
  if (previewEmail) {
    config.headers["X-Impersonate-As"] = previewEmail;
  }
  return config;
});

export const setSessionToken = (token) => {
  if (token) localStorage.setItem("session_token", token);
  else localStorage.removeItem("session_token");
};

export const getSessionToken = () => localStorage.getItem("session_token");

export const getPreviewAs = () => localStorage.getItem(PREVIEW_KEY);
export const setPreviewAs = (email) => {
  if (email) localStorage.setItem(PREVIEW_KEY, email);
  else localStorage.removeItem(PREVIEW_KEY);
};
