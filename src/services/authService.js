import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const registerUser = async (userData) => {
    try {
        // 1. Limpiamos el objeto: enviamos solo lo que schemas.py espera
        const cleanData = {
            username: userData.username,
            email: userData.email,
            password: userData.password
        };

        // 2. Usamos axios directamente para evitar errores de la instancia 'api'
        const response = await axios.post(`${API_URL}/register`, cleanData);
        console.log("Registro exitoso:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error capturado en el servicio:", error.response?.data);
        // Devolvemos un mensaje claro para el frontend
        throw error.response?.data?.detail || "Error en el registro";
    }
};

export const loginUser = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${API_URL}/token`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
};