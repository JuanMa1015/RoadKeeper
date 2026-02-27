import api from '../api/axios';


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

// Nueva función para actualizar solo el kilometraje
export const updateKilometraje = async (motoId, nuevoKm) => {
    try {
        // Pasamos el nuevo_km como parámetro de consulta (?nuevo_km=...)
        const response = await api.patch(`/motos/${motoId}/kilometraje?nuevo_km=${nuevoKm}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Error al actualizar kilometraje";
    }
};

export const addMantenimiento = async (data) => {
  const response = await axiosInstance.post('/mantenimientos', data);
  return response.data;
};