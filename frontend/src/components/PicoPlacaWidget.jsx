import { useEffect, useState } from 'react';
import api from '../api/axios';

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.9 1.8 18.2a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" />
    </svg>
  );
}

export default function PicoPlacaWidget({ placa }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPicoPlaca = async () => {
      if (!placa) {
        if (isMounted) {
          setError('No se pudo verificar Pico y Placa');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/api/pico-y-placa/${encodeURIComponent(placa)}`);
        if (isMounted) {
          setData(response.data);
        }
      } catch {
        if (isMounted) {
          setError('No se pudo verificar Pico y Placa');
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPicoPlaca();

    return () => {
      isMounted = false;
    };
  }, [placa]);

  if (loading) {
    return (
      <div className="h-[118px] rounded-2xl border border-slate-700/80 bg-slate-800/40 px-4 py-3 flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[118px] rounded-2xl border border-slate-700/80 bg-slate-800/40 px-4 py-3 flex flex-col justify-center">
        <p className="text-xs text-slate-300 font-semibold">Pico y Placa</p>
        <p className="text-[11px] text-slate-400 mt-1">No se pudo verificar Pico y Placa</p>
      </div>
    );
  }

  const applies = Boolean(data.aplica_hoy);
  const containerStyle = applies
    ? 'border-red-500/40 bg-red-500/10'
    : 'border-emerald-500/40 bg-emerald-500/10';
  const titleStyle = applies ? 'text-red-300' : 'text-emerald-300';
  const textStyle = applies ? 'text-red-200/90' : 'text-emerald-200/90';

  return (
    <div className={`h-[118px] rounded-2xl border px-4 py-3 flex flex-col justify-between ${containerStyle}`}>
      <div className="flex items-center gap-2">
        <span className={titleStyle}>{applies ? <AlertIcon /> : <CheckIcon />}</span>
        <p className={`text-xs font-bold ${titleStyle}`}>{applies ? 'Pico y Placa hoy' : 'Sin restricción hoy'}</p>
      </div>

      <p className={`text-[11px] leading-4 ${textStyle}`}>Día: {data.dia} | Dígito evaluado: {data.digito_evaluado}</p>

      <p className="text-[11px] text-slate-300 truncate">{applies ? data.horarios : data.mensaje}</p>
    </div>
  );
}

// ROADKEEPER - modificado por Copilot 2026-04-06