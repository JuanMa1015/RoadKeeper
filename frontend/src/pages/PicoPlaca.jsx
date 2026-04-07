import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getMotos } from '../services/motoService';

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.9 1.8 18.2a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" />
    </svg>
  );
}

export default function PicoPlaca() {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userMotos, setUserMotos] = useState([]);
  const [motosStatus, setMotosStatus] = useState([]);
  const [loadingMotos, setLoadingMotos] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setIsAuthenticated(Boolean(sessionStorage.getItem('token')));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoadingMotos(true);
      setError('');
      try {
        const summaryReq = api.get('/api/pico-y-placa/resumen');
        const userReq = isAuthenticated ? getMotos() : Promise.resolve([]);
        const [summaryRes, motos] = await Promise.all([summaryReq, userReq]);

        setSummary(summaryRes.data);

        if (isAuthenticated) {
          const cleaned = Array.isArray(motos) ? motos : [];
          setUserMotos(cleaned);

          const statusList = await Promise.all(
            cleaned.map(async (moto) => {
              try {
                const response = await api.get(`/api/pico-y-placa/${encodeURIComponent(moto.placa)}`);
                return { placa: moto.placa, ok: true, data: response.data };
              } catch {
                return { placa: moto.placa, ok: false, data: null };
              }
            })
          );
          setMotosStatus(statusList);
        }
      } catch {
        setError('No fue posible cargar la información de Pico y Placa.');
      } finally {
        setLoadingMotos(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleConsultar = async (e) => {
    e.preventDefault();

    const normalized = placa.toUpperCase().trim();
    if (!normalized) {
      setError('Ingresa una placa para consultar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/pico-y-placa/${encodeURIComponent(normalized)}`);
      setResult(response.data);
    } catch (err) {
      setResult(null);
      setError(err?.response?.data?.detail || 'No fue posible consultar Pico y Placa.');
    } finally {
      setLoading(false);
    }
  };

  const applies = Boolean(result?.aplica_hoy);

  const weekDays = summary?.reglas || [];

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 p-6 md:p-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Pico y Placa Medellín</h1>
        <p className="text-slate-300 mt-3 text-sm md:text-base max-w-3xl">
          Consulta por placa, visualiza el tablero general semanal de Medellín y revisa automáticamente el estado de todas tus motos.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 rounded-3xl border border-slate-700 bg-slate-800/50 p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white">General Medellín</h2>
            <span className="text-xs text-slate-300 uppercase tracking-widest">Actualizado</span>
          </div>

          {summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400 uppercase">Periodo</p>
                  <p className="text-slate-100 font-semibold mt-1">{summary.periodo}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400 uppercase">Criterio</p>
                  <p className="text-slate-100 font-semibold mt-1">{summary.criterio}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400 uppercase">Horario</p>
                  <p className="text-slate-100 font-semibold mt-1">{summary.horario}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {weekDays.map((regla) => (
                  <div key={regla.dia} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                    <p className="text-sm font-bold text-slate-100">{regla.dia}</p>
                    <p className="mt-2 text-2xl font-black text-blue-300">{regla.digitos.join(' · ')}</p>
                    <p className="text-xs text-slate-400 mt-2">Dígitos restringidos</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400">{summary.mensaje}</p>
            </>
          ) : (
            <p className="text-slate-400">No hay resumen general disponible.</p>
          )}
        </article>

        <article className="rounded-3xl border border-slate-700 bg-slate-800/50 p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-black text-white">Consulta por placa</h2>
          <form onSubmit={handleConsultar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Placa</label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ej: ABC12F"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          {result && (
            <div className={`rounded-2xl border p-4 space-y-3 ${applies ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
              <div className="flex items-center gap-2">
                <span className={applies ? 'text-red-300' : 'text-emerald-300'}>{applies ? <AlertIcon /> : <CheckIcon />}</span>
                <p className={`font-bold ${applies ? 'text-red-300' : 'text-emerald-300'}`}>
                  {applies ? 'Pico y Placa hoy' : 'Sin restricción hoy'}
                </p>
              </div>

              <p className="text-slate-200 text-sm">{result.mensaje}</p>
              <p className="text-slate-300 text-sm">Día: {result.dia} | Dígito evaluado: {result.digito_evaluado}</p>
              <p className="text-slate-300 text-sm">Horarios: {result.horarios || 'No aplica hoy'}</p>
            </div>
          )}
        </article>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm font-semibold">
          {error}
        </div>
      )}

      <article className="rounded-3xl border border-slate-700 bg-slate-800/40 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-black text-white">Estado de tus motos</h2>
          <span className="text-xs text-slate-400 uppercase tracking-widest">{isAuthenticated ? 'Sesión activa' : 'Sin sesión'}</span>
        </div>

        {loadingMotos ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <p className="text-slate-400 text-sm">Inicia sesión para ver el estado automático de tus motos registradas.</p>
        ) : userMotos.length === 0 ? (
          <p className="text-slate-400 text-sm">Aún no tienes motos registradas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {motosStatus.map((item) => (
              <div key={item.placa} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400 uppercase">Placa</p>
                <p className="text-2xl font-black text-white tracking-tight mt-1">{item.placa}</p>

                {item.ok ? (
                  <div className={`mt-3 rounded-xl border px-3 py-3 ${item.data.aplica_hoy ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
                    <p className={`text-sm font-bold ${item.data.aplica_hoy ? 'text-red-300' : 'text-emerald-300'}`}>
                      {item.data.aplica_hoy ? 'Pico y Placa hoy' : 'Sin restricción hoy'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">{item.data.dia} | Dígito: {item.data.digito_evaluado}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3">No se pudo verificar esta placa.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

// ROADKEEPER - modificado por Copilot 2026-04-06