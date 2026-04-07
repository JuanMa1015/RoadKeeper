import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Notifications({ alertas }) {
  const navigate = useNavigate();

  if (alertas.length === 0) return null;

  const total = alertas.length;
  const criticas = alertas.filter((alerta) => alerta.prioridad === 'ALTA').length;
  const toneClass = criticas > 0
    ? 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/15'
    : 'border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15';

  return (
    <div className="mb-6 flex justify-end">
      <button
        onClick={() => navigate('/recordatorios')}
        className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-lg shadow-slate-950/20 transition ${toneClass}`}
        title="Ir a Recordatorios"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${criticas > 0 ? 'bg-red-400' : 'bg-amber-300'}`} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-300/80">Alertas</span>
        <span className="text-xl font-black leading-none">{total}</span>
      </button>
    </div>
  );
}