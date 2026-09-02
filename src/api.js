import axios from "axios";

// Uses the Render backend URL in production, or falls back to localhost for development
const API = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// CRITICAL INTERCEPTOR WORKER: Packs your token safely on every call
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
