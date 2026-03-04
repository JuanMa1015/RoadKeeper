import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMotos, updateKilometraje, registrarMantenimiento, getNotificaciones } from '../services/motoService';
import MotoCard from '../components/MotoCard';
import Notifications from '../components/Notifications';
import ServiceModal from '../components/ServiceModal';

export default function Mantenimientos() {
  const [motos, setMotos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Al inicio de Mantenimientos.jsx añade:
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedMoto, setSelectedMoto] = useState(null);

const handleOpenModal = (moto) => {
  setSelectedMoto(moto);
  setIsModalOpen(true);
};

const handleConfirmService = async (tipo, valor) => {
  const esDocumento = ["SOAT", "Tecnomecánica"].includes(tipo);
  try {
    await registrarMantenimiento({
      moto_id: selectedMoto.id,
      tipo: tipo,
      km_momento_servicio: esDocumento ? selectedMoto.kilometraje_actual : parseFloat(valor),
      fecha_servicio: esDocumento ? valor : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
    fetchData();
  } catch (err) {
    alert("Error al registrar");
  }
};

// Y en el return, al final del div principal:
<ServiceModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
  moto={selectedMoto || {}} 
  onConfirm={handleConfirmService} 
/>

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [motosData, alertasData] = await Promise.all([
        getMotos(),
        getNotificaciones()
      ]);
      setMotos(Array.isArray(motosData) ? motosData : []);
      setAlertas(alertasData || []);
    } catch (err) {
      console.error("Error cargando el garaje:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKm = async (id, current) => {
    const nextKm = window.prompt(`KM actual: ${current}. Ingrese nuevo KM:`);
    if (nextKm && parseFloat(nextKm) >= current) {
      try {
        await updateKilometraje(id, parseFloat(nextKm));
        fetchData();
      } catch (err) {
        alert("Error al actualizar el kilometraje");
      }
    }
  };

  // Función corregida para gestionar TODO tipo de mantenimiento
  const handleGestionarTodo = async (moto) => {
    const tipo = window.prompt("¿Qué deseas registrar? (Aceite, Frenos, Kit Arrastre, SOAT, Tecnomecánica)");
    if (!tipo) return;

    const esDocumento = ["SOAT", "Tecnomecánica"].includes(tipo);
    const mensajeValor = esDocumento 
      ? "Ingrese fecha del documento (AAAA-MM-DD):" 
      : `Confirma ${tipo} al KM ${moto.kilometraje_actual}? (Presione OK para confirmar o escriba un KM específico)`;

    const valor = window.prompt(mensajeValor, esDocumento ? new Date().toISOString().split('T')[0] : moto.kilometraje_actual);

    if (valor) {
      try {
        await registrarMantenimiento({
          moto_id: moto.id,
          tipo: tipo,
          km_momento_servicio: esDocumento ? moto.kilometraje_actual : parseFloat(valor),
          fecha_servicio: esDocumento ? valor : new Date().toISOString().split('T')[0]
        });
        fetchData();
      } catch (err) {
        alert("Error al registrar el servicio");
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {motos.map((moto) => (
          <MotoCard 
            key={moto.id} 
            moto={moto} 
            onUpdateKm={handleUpdateKm}
            onResetServicio={() => handleGestionarTodo(moto)} // Ahora usa la función integral
          />
        ))}
      </div>
    </div>
  );
}