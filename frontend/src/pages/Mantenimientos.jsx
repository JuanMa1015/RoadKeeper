import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMotos, updateKilometraje, registrarMantenimiento, getNotificaciones } from '../services/motoService';
import MotoCard from '../components/MotoCard';
import Notifications from '../components/Notifications';
import ServiceModal from '../components/ServiceModal';

const GARAGE_CACHE_KEY = 'rk-garage-cache-v1';

export default function Mantenimientos() {
  const [motos, setMotos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState(null);
  const [expandedMotoId, setExpandedMotoId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { fetchData({ useCache: true }); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const placaParam = params.get('placa');
    if (!placaParam || motos.length === 0) return;

    const target = motos.find((moto) => moto.placa === placaParam);
    if (target) {
      setSelectedMoto(target);
      setIsModalOpen(true);
      setExpandedMotoId(target.id);
    }
  }, [location.search, motos]);

  useEffect(() => {
    if (!feedback.message) return;
    const timer = setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedback.message]);

  const handleOpenModal = (moto) => {
    setSelectedMoto(moto);
    setIsModalOpen(true);
  };

  const handleConfirmService = async (registros) => {
    if (!selectedMoto) return { ok: false, message: 'No hay moto seleccionada.' };

    try {
      for (const item of registros) {
        const esDocumento = ["SOAT", "Tecnomecánica"].includes(item.tipo);
        await registrarMantenimiento({
          moto_id: selectedMoto.id,
          tipo: item.tipo,
          km_momento_servicio: esDocumento ? selectedMoto.kilometraje_actual : parseFloat(item.valor),
          fecha_servicio: esDocumento ? item.valor : new Date().toISOString().split('T')[0]
        });
      }

      const successMessage = registros.length > 1
        ? `Se registraron ${registros.length} servicios para ${selectedMoto.placa}.`
        : `Servicio ${registros[0].tipo} registrado para ${selectedMoto.placa}.`;

      setFeedback({ type: 'success', message: successMessage });
      await fetchData({ useCache: false });
      return { ok: true, message: successMessage };
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const errorMessage = Array.isArray(detail)
        ? detail.map((d) => d?.msg).filter(Boolean).join(' | ')
        : (typeof detail === 'string' ? detail : 'Error al registrar el servicio');
      setFeedback({ type: 'error', message: errorMessage });
      return { ok: false, message: errorMessage };
    }
  };

  const fetchData = async ({ useCache = false } = {}) => {
    try {
      if (useCache) {
        const cached = sessionStorage.getItem(GARAGE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.motos)) {
            setMotos(parsed.motos);
            setAlertas(Array.isArray(parsed?.alertas) ? parsed.alertas : []);
            setLoading(false);
          }
        }
      } else {
        setLoading(true);
      }

      const motosData = await getMotos();
      setMotos(Array.isArray(motosData) ? motosData : []);

      // Persistimos una instantánea para acelerar la siguiente visita al módulo.
      sessionStorage.setItem(
        GARAGE_CACHE_KEY,
        JSON.stringify({
          motos: Array.isArray(motosData) ? motosData : [],
          alertas,
          savedAt: Date.now(),
        })
      );

      setLoading(false);

      // Las notificaciones se cargan después para no bloquear el render principal del garaje.
      getNotificaciones()
        .then((alertasData) => {
          const nextAlertas = alertasData || [];
          setAlertas(nextAlertas);
          sessionStorage.setItem(
            GARAGE_CACHE_KEY,
            JSON.stringify({
              motos: Array.isArray(motosData) ? motosData : [],
              alertas: nextAlertas,
              savedAt: Date.now(),
            })
          );
        })
        .catch(() => {
          // Si falla, mantenemos el garaje visible y evitamos bloquear UX.
        });
    } catch (err) {
      console.error("Error cargando el garaje:", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKm = async (id, current) => {
    const nextKm = window.prompt(`KM actual: ${current}. Ingrese nuevo KM:`);
    if (nextKm && parseFloat(nextKm) >= current) {
      try {
        await updateKilometraje(id, parseFloat(nextKm));
        fetchData({ useCache: false });
      } catch (err) {
        alert("Error al actualizar el kilometraje");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-500 font-black tracking-widest animate-pulse">SINCRONIZANDO GARAJE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {feedback.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
              : 'bg-red-950/40 border-red-700 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Notifications alertas={alertas} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Mi <span className="text-blue-600">Garaje</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-[0.2em] text-[10px] uppercase">RoadKeeper Professional Systems</p>
        </div>
        
        <button 
          onClick={() => navigate('/add-moto')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-900/20 active:scale-95"
        >
          + REGISTRAR MOTO
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold">Consulta rápida Pico y Placa Medellín</p>
          <p className="text-slate-400 text-sm">Revisa cualquier placa y valida restricción del día.</p>
        </div>
        <button
          onClick={() => navigate('/pico-placa')}
          className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-600 text-slate-200 hover:border-blue-500 hover:text-white transition-all text-sm font-bold"
        >
          Ir al apartado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {motos.map((moto) => (
          <MotoCard 
            key={moto.id} 
            moto={moto} 
            onUpdateKm={handleUpdateKm}
            onResetServicio={() => handleOpenModal(moto)}
            expanded={expandedMotoId === moto.id}
            onToggleExpand={() => setExpandedMotoId((prev) => (prev === moto.id ? null : moto.id))}
          />
        ))}
      </div>

      <ServiceModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMoto(null);
          navigate('/mantenimientos', { replace: true });
        }} 
        moto={selectedMoto || {}} 
        onConfirm={handleConfirmService} 
      />
    </div>
  );
}

// ROADKEEPER - modificado por Copilot 2026-04-06