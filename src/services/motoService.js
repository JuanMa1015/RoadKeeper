import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getMotos = async () => (await api.get('/motos')).data;

export const createMoto = async (motoData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:8000/motos', motoData, {
        headers: {
            'Authorization': `Bearer ${token}` // ¡Esto es vital!
        }
    });
    return response.data;
};

export const updateKilometraje = async (id, km) => {
  return (await api.put(`/motos/${id}/km`, { kilometraje_actual: km })).data;
};

// Se agregó la exportación que faltaba
export const getNotificaciones = async () => {
  return (await api.get('/notificaciones')).data;
};

export const registrarMantenimiento = async (data) => {
  return (await api.post('/mantenimientos', data)).data;
};