import axios from 'axios';
import api from '../api/axios';

const API_URL = 'http://localhost:8000';

export const registerUser = async (userData) => {
    const cleanData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
    };

    const response = await axios.post(`${API_URL}/auth/register`, cleanData);
    return response.data;
};

export const loginUser = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${API_URL}/auth/login`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    
    // Si requiere 2FA, guardar el temp_token en sessionStorage y devolver la respuesta
    if (response.data.requires_2fa) {
        sessionStorage.setItem('temp_token', response.data.temp_token);
        return response.data;  // { requires_2fa: true, temp_token: "..." }
    }
    
    // Si no requiere 2FA, guardar el token completo en sessionStorage
    if (response.data.access_token) {
        sessionStorage.setItem('token', response.data.access_token);
    }
    return response.data;
};

export const verify2FA = async (code) => {
    const tempToken = sessionStorage.getItem('temp_token');
    if (!tempToken) {
        throw new Error("Sesión de 2FA expirada. Por favor, inicia sesión nuevamente.");
    }

    const response = await axios.post(`${API_URL}/auth/2fa/login-verify`, {
        temp_token: tempToken,
        code: code
    });

    if (response.data.access_token) {
        sessionStorage.setItem('token', response.data.access_token);
        sessionStorage.removeItem('temp_token');  // Limpiar el temp_token
    }
    return response.data;
};

export const setup2FA = async () => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
};

export const verify2FASetup = async (totpSecret, code) => {
    const response = await api.post('/auth/2fa/verify-setup', {
        totp_secret: totpSecret,
        code: code
    });
    return response.data;
};

export const disable2FA = async (code) => {
    const response = await api.post('/auth/2fa/disable', { code });
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const updateProfile = async ({ newUsername, newEmail, currentPassword, twoFactorCode }) => {
    const response = await api.put('/auth/profile', {
        new_username: newUsername || null,
        new_email: newEmail || null,
        current_password: currentPassword || null,
        two_factor_code: twoFactorCode || null,
    });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (resetToken, newPassword) => {
    const response = await api.post('/auth/reset-password', {
        reset_token: resetToken,
        new_password: newPassword,
    });
    return response.data;
};