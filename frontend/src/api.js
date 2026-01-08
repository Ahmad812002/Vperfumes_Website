
import axios from "axios";

// const BACKEND_URL = "http://127.0.0.1:8000";
// const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;
// const api = axios.create({
//   baseURL: API,
//   withCredentials: true, // set once
// });

const api = axios.create({
<<<<<<< HEAD
  baseURL: process.env.REACT_APP_API_BASE_URL,
=======
  baseURL: process.env.VITE_API_BASE_URL,
>>>>>>> refs/remotes/origin/main
  withCredentials: true, // set once
});

export default api;
