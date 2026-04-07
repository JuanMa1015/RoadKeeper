import React, { useMemo } from 'react';
import PicoPlacaWidget from './PicoPlacaWidget';

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 1 0 3 3l-5.5 5.5a2 2 0 0 1-2.8 0l-.2-.2a2 2 0 0 1 0-2.8L14.7 6.3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m17 4 3 3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

export default function MotoCard({ moto, onUpdateKm, onResetServicio, expanded, onToggleExpand }) {

  // Configuración de límites para mantenimientos por Kilometraje
  const CONFIG_KM = [
    { tipo: "Aceite", limite: 5000, color: "blue" },
    { tipo: "Frenos", limite: 8000, color: "orange" },
    { tipo: "Kit Arrastre", limite: 15000, color: "purple" }
  ];

  // Configuración para documentos legales (se guarda fecha de vencimiento)
  const CONFIG_FECHA = [
    { tipo: "SOAT" },
    { tipo: "Tecnomecánica" }
  ];

  const mantenimientos = moto.mantenimientos || [];

  const quickSummary = useMemo(() => {
    const docs = CONFIG_FECHA.map((doc) => {
      const ultReg = [...mantenimientos]
        .filter((m) => m.tipo === doc.tipo)
        .sort((a, b) => new Date(b.fecha_servicio || b.fecha || 0) - new Date(a.fecha_servicio || a.fecha || 0))[0];

      const rawDate = ultReg?.fecha_servicio || ultReg?.fecha;
      if (!rawDate) {
        return { tipo: doc.tipo, estado: 'SIN_REGISTRO', texto: 'Sin registro' };
      }

      const baseDate = new Date(rawDate);
      if (Number.isNaN(baseDate.getTime())) {
        return { tipo: doc.tipo, estado: 'SIN_REGISTRO', texto: 'Sin registro' };
      }

      const diasRestantes = Math.ceil((baseDate - new Date()) / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        return { tipo: doc.tipo, estado: 'VENCIDO', texto: `Vencido hace ${Math.abs(diasRestantes)}d` };
      }

      if (diasRestantes === 0) {
        return { tipo: doc.tipo, estado: 'POR_VENCER', texto: 'Vence hoy' };
      }

      if (diasRestantes === 1) {
        return { tipo: doc.tipo, estado: 'POR_VENCER', texto: 'Vence mañana' };
      }

      if (diasRestantes <= 15) {
        return { tipo: doc.tipo, estado: 'POR_VENCER', texto: `Vence en ${diasRestantes}d` };
      }

      return { tipo: doc.tipo, estado: 'AL_DIA', texto: `Al día (${diasRestantes}d)` };
    });

    return docs;
  }, [mantenimientos]);

  const renderBarraProgreso = (tipo, limite, colorBase) => {
    const servicios = moto.mantenimientos || [];
    const ultServicio = [...servicios]
      .filter(m => m.tipo === tipo)
      .sort((a, b) => b.km_momento_servicio - a.km_momento_servicio)[0];

    const kmBase = ultServicio ? ultServicio.km_momento_servicio : 0;
    const recorrido = moto.kilometraje_actual - kmBase;
    const pct = Math.min(Math.max((recorrido / limite) * 100, 0), 100);
    const esCritico = pct > 85;

    return (
      <div key={tipo} className="group">
        <div className="flex justify-between text-[10px] mb-1 font-black uppercase tracking-tighter">
          <span className="text-slate-400 group-hover:text-white transition-colors">{tipo}</span>
          <span className={esCritico ? "text-red-500 animate-pulse" : `text-${colorBase}-400`}>
            {Math.round(pct)}%
          </span>
        </div>
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full transition-all duration-1000 ${esCritico ? 'bg-red-500' : `bg-${colorBase}-600`}`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const ultimosServicios = useMemo(() => {
    return [...mantenimientos]
      .filter((m) => m.tipo !== 'SOAT' && m.tipo !== 'Tecnomecánica')
      .sort((a, b) => new Date(b.fecha_servicio || b.fecha || 0) - new Date(a.fecha_servicio || a.fecha || 0))
      .slice(0, 3);
  }, [mantenimientos]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] shadow-2xl hover:border-blue-500/30 transition-all group/card">
      {/* Header: Placa y Acciones Rápidas */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">Placa</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter group-hover/card:text-blue-400 transition-colors">
            {moto.placa}
          </h3>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mt-2">Odómetro</p>
          <p className="text-lg font-mono font-black text-white italic leading-none">
            {moto.kilometraje_actual.toLocaleString()} <span className="text-[10px] text-blue-500">KM</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onResetServicio(moto)}
            className="bg-slate-800 text-slate-400 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"
            title="Registrar Mantenimiento"
          >
            <WrenchIcon />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <PicoPlacaWidget placa={moto.placa} />

        <div className="grid grid-cols-2 gap-2">
          {quickSummary.map((item) => (
            <div key={item.tipo} className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-slate-500">{item.tipo}</p>
              <p className={`text-[11px] font-semibold mt-1 ${item.estado === 'VENCIDO' ? 'text-red-400' : item.estado === 'POR_VENCER' ? 'text-amber-300' : item.estado === 'AL_DIA' ? 'text-emerald-300' : 'text-slate-400'}`}>
                {item.texto}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <button
            onClick={onToggleExpand}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 py-2 text-xs font-black uppercase tracking-wider transition-all"
          >
            {expanded ? 'Ocultar detalle' : 'Ver detalle completo'}
          </button>
        </div>

        {expanded && (
          <>
            {/* Sección de Kilometraje (Barras) */}
            <div className="space-y-3">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-1">Estado de Componentes</p>
              {CONFIG_KM.map(item => renderBarraProgreso(item.tipo, item.limite, item.color))}
            </div>

            <div className="space-y-2">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-1">Últimos Servicios</p>
              {ultimosServicios.length === 0 && (
                <p className="text-[10px] text-slate-400">Sin servicios mecánicos recientes.</p>
              )}
              {ultimosServicios.map((servicio) => (
                <div key={servicio.id} className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-300">{servicio.tipo}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(servicio.km_momento_servicio || 0).toLocaleString()} km</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button 
            onClick={() => onUpdateKm(moto.id, moto.kilometraje_actual)}
            className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
            title="Actualizar kilometraje"
          >
            <EditIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ROADKEEPER - modificado por Copilot 2026-04-06