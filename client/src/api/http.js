import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api"
});

export const setAuthToken = (token) => {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
};
