import api from '../api/axios';

export const registerUser = async (userData) => {
    try {
        const response = await api.post('/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Error en el registro";
    }
};

export const loginUser = async (username, password) => {
    try {
        
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/token', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    } catch (error) {
        // Si el error es 401, el mensaje vendrá en error.response.data.detail
        throw error.response?.data?.detail || "Usuario o contraseña incorrectos";
    }
};