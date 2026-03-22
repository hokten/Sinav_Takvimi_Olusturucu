import axios from "axios";

// Configure base URL
axios.defaults.baseURL = "http://localhost:3001/api";

// Request interceptor for tokens
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global errors (401, 500)
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 && !error.config.url?.endsWith("/auth/login")) {
        // Unauthorized - Clear session and redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      
      if (status >= 500) {
        console.error("[Axios Error 500+]", error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
