import axios from 'axios';

// Using relative path '/api' so it works on both localhost and Render automatically
const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      const cleanToken = token.replace(/^"(.*)"$/, '$1').trim();

      // ⚠️ IMPORTANT: Note the SPACE after Bearer!
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;