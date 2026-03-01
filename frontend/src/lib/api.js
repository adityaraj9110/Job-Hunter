import axios from 'axios';

const baseUrl  = import.meta.env.VITE_API_URL || "http://localhost:4000"
const api = axios.create({
  baseURL:  baseUrl + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
