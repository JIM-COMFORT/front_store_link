import axios from "axios";

const API = axios.create({ 
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// CRITICAL INTERCEPTOR WORKER: Packs your token safely on every call
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Note: The word 'Bearer' must have a single empty space after it!
    config.headers.Authorization = `Bearer ${token}`; 
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
