import React from 'react';

export default function Notifications({ alertas }) {
  if (alertas.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {alertas.map((alerta, index) => (
        <div 
          key={index} 
          className={`p-4 rounded-2xl border flex items-center gap-4 animate-pulse-slow ${
            alerta.prioridad === 'ALTA' 
            ? 'bg-red-500/10 border-red-500/50 text-red-500' 
            : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'
          }`}
        >
          <span className="text-xl">{alerta.prioridad === 'ALTA' ? '🚨' : '⚠️'}</span>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest">Alerta de Seguridad</p>
            <p className="text-sm font-bold">Moto {alerta.placa}: {alerta.mensaje}</p>
          </div>
        </div>
      ))}
    </div>
  );
}