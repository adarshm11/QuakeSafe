import axios from "axios";

// Replace with your actual backend URL when deployed
const API_URL = "http://localhost:8000"; // For development

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
