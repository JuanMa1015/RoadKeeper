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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('temp_token');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const isAuthSessionError = (error) => {
    if (error?.response?.status !== 401) {
        return false;
    }

    const detailRaw = error?.response?.data?.detail;
    const detail = typeof detailRaw === 'string' ? detailRaw.toLowerCase() : '';
    const hasBearerChallenge = Boolean(error?.response?.headers?.['www-authenticate']);

    // Only force logout when backend indicates token/session problems.
    return (
        hasBearerChallenge ||
        detail.includes('token') ||
        detail.includes('expirad') ||
        detail.includes('no se pudo validar el acceso') ||
        detail.includes('usuario no encontrado')
    );
};

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
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
        const requestUrl = String(error?.config?.url || '');
        const isTwoFactorFlow = requestUrl.includes('/auth/2fa/verify-setup') || requestUrl.includes('/auth/2fa/disable');

        if (isTwoFactorFlow) {
            return Promise.reject(error);
        }

        if (isAuthSessionError(error)) {
            redirectToLogin();
        }
        return Promise.reject(error);
    }
);

export default api;
