import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

export function useRecordatorios() {
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecordatorios = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/api/recordatorios/');
      setRecordatorios(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        setRecordatorios([]);
        return;
      }
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordatorios();
  }, [fetchRecordatorios]);

  return {
    recordatorios,
    loading,
    error,
    refetch: fetchRecordatorios,
  };
}
