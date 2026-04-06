import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

const getTokenExpiry = (token) => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    } catch {
        return 0;
    }
};

const redirectToLogin = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('temp_token');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        const expiresAt = getTokenExpiry(token);
        if (expiresAt && Date.now() >= expiresAt) {
            redirectToLogin();
            return Promise.reject(new Error('Sesión expirada'));
        }
    }

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            redirectToLogin();
        }
        return Promise.reject(error);
    }
);

export default api;
