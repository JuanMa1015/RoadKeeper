import React from 'react';

export default function MotoCard({ moto, onUpdateKm, onResetServicio }) {
  
  // Configuración de límites para mantenimientos por Kilometraje
  const CONFIG_KM = [
    { tipo: "Aceite", limite: 5000, color: "blue" },
    { tipo: "Frenos", limite: 8000, color: "orange" },
    { tipo: "Kit Arrastre", limite: 15000, color: "purple" }
  ];

  // Configuración para documentos legales (Días)
  const CONFIG_FECHA = [
    { tipo: "SOAT", duracion: 365 },
    { tipo: "Tecnomecánica", duracion: 365 }
  ];

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

  const renderEstadoDocumento = (tipo, duracion) => {
    const servicios = moto.mantenimientos || [];
    const ultReg = [...servicios]
      .filter(m => m.tipo === tipo)
      .sort((a, b) => new Date(b.fecha_servicio) - new Date(a.fecha_servicio))[0];

    if (!ultReg) return (
      <div key={tipo} className="text-[9px] text-yellow-500/50 font-bold uppercase italic">⚠️ Sin registro de {tipo}</div>
    );

    const fechaVencimiento = new Date(ultReg.fecha_servicio);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + duracion);
    
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    const esCritico = diasRestantes <= 15;

    return (
      <div key={tipo} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-white/5">
        <span className="text-[10px] text-slate-400 font-black uppercase">{tipo}</span>
        <span className={`text-[10px] font-mono ${esCritico ? 'text-red-500 font-black' : 'text-green-500'}`}>
          {diasRestantes > 0 ? `Vence en ${diasRestantes}d` : 'VENCIDO'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl hover:border-blue-500/30 transition-all group/card">
      {/* Header: Placa y Acciones Rápidas */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">Machine ID</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter group-hover/card:text-blue-400 transition-colors">
            {moto.placa}
          </h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onResetServicio(moto, "Aceite")}
            className="bg-slate-800 text-slate-400 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"
            title="Registrar Mantenimiento"
          >
            🛠️
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sección de Kilometraje (Barras) */}
        <div className="space-y-3">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-1">Estado de Componentes</p>
          {CONFIG_KM.map(item => renderBarraProgreso(item.tipo, item.limite, item.color))}
        </div>

        {/* Sección de Documentos Legales */}
        <div className="space-y-2">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-1">Documentación Legal</p>
          {CONFIG_FECHA.map(doc => renderEstadoDocumento(doc.tipo, doc.duracion))}
        </div>

        {/* Footer: Odometer y Update */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-tighter">Total Odometer</p>
            <p className="text-2xl font-mono font-black text-white italic">
              {moto.kilometraje_actual.toLocaleString()} <span className="text-[10px] text-blue-500">KM</span>
            </p>
          </div>
          <button 
            onClick={() => onUpdateKm(moto.id, moto.kilometraje_actual)}
            className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
          >
            ✏️
          </button>
        </div>
      </div>
    </div>
  );
}