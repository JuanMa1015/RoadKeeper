import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMotos, updateKilometraje } from '../services/motoService';

export default function Mantenimientos() {
  const [motos, setMotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMotos();
  }, []);

  const fetchMotos = async () => {
    try {
      const data = await getMotos();
      setMotos(data);
    } catch (err) {
      console.error("Error al cargar motos:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * LÓGICA DE NEGOCIO REAL:
   * Calcula el progreso basado en el historial de mantenimientos.
   */
  const calcularProgresoAceite = (moto) => {
    const INTERVALO_ACEITE = 5000;
    
    // Buscamos mantenimientos de tipo Aceite y ordenamos por km descendente
    const serviciosAceite = moto.mantenimientos
      ?.filter(m => m.tipo === "Aceite")
      .sort((a, b) => b.km_momento_servicio - a.km_momento_servicio);

    // Si hay un registro previo, usamos ese KM. Si no, asumimos 0 (moto nueva).
    const ultimoKmServicio = serviciosAceite?.length > 0 
      ? serviciosAceite[0].km_momento_servicio 
      : 0;

    const kmRecorridosDesdeServicio = moto.kilometraje_actual - ultimoKmServicio;
    
    // Calculamos porcentaje sin pasarnos de 100 ni bajar de 0
    const porcentaje = (kmRecorridosDesdeServicio / INTERVALO_ACEITE) * 100;
    return Math.min(Math.max(porcentaje, 0), 100);
  };

  const handleUpdateKm = async (id, current) => {
    const nextKm = window.prompt(`Kilometraje actual es ${current}. Ingrese el nuevo kilometraje:`);
    if (nextKm && parseFloat(nextKm) >= current) {
      try {
        await updateKilometraje(id, parseFloat(nextKm));
        fetchMotos(); // Recargamos para ver el cambio en la barra
      } catch (err) {
        alert("Error al actualizar el kilometraje");
      }
    } else if (nextKm) {
      alert("El nuevo kilometraje no puede ser menor al actual.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-20 text-blue-500">
      <span className="animate-spin text-4xl mr-4">⚙️</span>
      <span className="text-xl font-bold uppercase tracking-widest">Cargando Garaje Real...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mi Garaje</h1>
          <p className="text-slate-500 font-medium">Control técnico de flota personal.</p>
        </div>
        <button 
          onClick={() => navigate('/add-moto')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-900/40 active:scale-95"
        >
          + REGISTRAR MOTO
        </button>
      </div>

      {motos.length === 0 ? (
        <div className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-[2rem] p-16 text-center">
          <div className="text-7xl mb-6">🏁</div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase">Tu garaje está vacío</h2>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto">Registra tu primer vehículo para empezar a trackear el desgaste de tus consumibles.</p>
          <button 
            onClick={() => navigate('/add-moto')}
            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black hover:bg-blue-500 hover:text-white transition-all"
          >
            AÑADIR MI PRIMERA MOTO
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {motos.map((moto) => {
            // USAMOS LA NUEVA LÓGICA AQUÍ
            const progreso = calcularProgresoAceite(moto);
            
            return (
              <div key={moto.id} className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-[1.5rem] p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-blue-500 font-mono text-xs font-black tracking-[0.2em] uppercase">Placa</span>
                    <h3 className="text-3xl font-black text-white leading-none">{moto.placa}</h3>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-3 py-1 rounded-full uppercase font-black border border-blue-500/20">
                      {moto.marca}
                    </span>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase">{moto.modelo}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase mb-3 tracking-widest">
                      <span className="text-slate-400">Vida útil Aceite</span>
                      <span className={progreso > 85 ? 'text-red-500' : 'text-blue-400'}>
                        {Math.round(progreso)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700/50">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                          progreso > 85 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                        }`}
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                        {progreso > 85 ? '⚠️ Requiere cambio inmediato' : '✓ Estado operativo'}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-tighter">Odometer</p>
                      <p className="text-2xl font-mono font-black text-white italic">
                        {moto.kilometraje_actual.toLocaleString()} <span className="text-[10px] text-slate-500 not-italic">KM</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleUpdateKm(moto.id, moto.kilometraje_actual)}
                      className="p-3 bg-slate-700 hover:bg-blue-600 text-white rounded-xl transition-all group-hover:scale-110 shadow-lg"
                      title="Actualizar Kilometraje"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}