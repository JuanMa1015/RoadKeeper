import api from '../api/axios';

// Debate: Ya no necesitamos la interfaz { Moto }, JS maneja los objetos libremente
export const createMoto = async (motoData) => {
    try {
        const response = await api.post('/motos', motoData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Error al registrar la moto";
    }
};

export const getMotos = async () => {
    try {
        const response = await api.get('/motos');
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Error al obtener las motos";
    }
};