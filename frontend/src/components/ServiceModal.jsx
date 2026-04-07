import React, { useEffect, useState } from 'react';

export default function ServiceModal({ isOpen, onClose, moto, onConfirm }) {
  const [selectedTipos, setSelectedTipos] = useState([]);
  const [valores, setValores] = useState({});
  const [submitState, setSubmitState] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTipos([]);
    setValores({});
    setSubmitState({ type: '', message: '' });
    setIsSubmitting(false);
  }, [isOpen, moto?.id]);

  if (!isOpen) return null;

  const opciones = [
    { id: 'Aceite', icon: 'AC', label: 'Aceite', desc: 'Basado en KM' },
    { id: 'Frenos', icon: 'FR', label: 'Frenos', desc: 'Revision KM' },
    { id: 'Kit Arrastre', icon: 'KA', label: 'Kit Arrastre', desc: 'Revision KM' },
    { id: 'SOAT', icon: 'SO', label: 'SOAT', desc: 'Fecha de vencimiento' },
    { id: 'Tecnomecánica', icon: 'TE', label: 'Tecno', desc: 'Fecha de vencimiento' },
  ];

  const isDocumento = (tipo) => ["SOAT", "Tecnomecánica"].includes(tipo);
  const todayIso = new Date().toISOString().split('T')[0];

  const toggleTipo = (tipo) => {
    setSubmitState({ type: '', message: '' });
    setSelectedTipos((prev) => {
      if (prev.includes(tipo)) {
        const next = prev.filter((t) => t !== tipo);
        setValores((current) => {
          const clone = { ...current };
          delete clone[tipo];
          return clone;
        });
        return next;
      }

      setValores((current) => ({
        ...current,
        [tipo]: isDocumento(tipo) ? todayIso : String(moto?.kilometraje_actual ?? ''),
      }));
      return [...prev, tipo];
    });
  };

  const handleGuardar = async () => {
    if (selectedTipos.length === 0) {
      setSubmitState({ type: 'error', message: 'Selecciona al menos un servicio para registrar.' });
      return;
    }

    const registros = [];

    for (const tipo of selectedTipos) {
      const valor = (valores[tipo] ?? '').toString().trim();
      if (!valor) {
        setSubmitState({ type: 'error', message: `Falta el valor para ${tipo}.` });
        return;
      }

      if (isDocumento(tipo)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          setSubmitState({ type: 'error', message: `La fecha de ${tipo} no es válida.` });
          return;
        }
        registros.push({ tipo, valor });
      } else {
        const km = Number(valor);
        if (!Number.isFinite(km) || km <= 0) {
          setSubmitState({ type: 'error', message: `El kilometraje de ${tipo} debe ser mayor a 0.` });
          return;
        }
        registros.push({ tipo, valor: String(km) });
      }
    }

    setIsSubmitting(true);
    setSubmitState({ type: '', message: '' });
    const result = await onConfirm(registros);
    setIsSubmitting(false);

    if (result?.ok) {
      setSubmitState({ type: 'success', message: result.message || 'Servicios registrados correctamente.' });
      setTimeout(() => onClose(), 650);
      return;
    }

    setSubmitState({ type: 'error', message: result?.message || 'No se pudo registrar el servicio.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black text-white italic uppercase mb-2">Gestionar Servicio</h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Máquina: {moto.placa}</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {opciones.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleTipo(opt.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedTipos.includes(opt.id) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-xs block mb-1 font-black tracking-widest">{opt.icon}</span>
              <p className="font-black text-sm uppercase leading-tight">{opt.label}</p>
              <p className="text-[10px] opacity-60 font-medium">{opt.desc}</p>
            </button>
          ))}
        </div>

        {selectedTipos.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            {selectedTipos.map((tipo) => (
              <div key={tipo} className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {tipo}: {isDocumento(tipo) ? 'Fecha de vencimiento' : 'Kilometraje de servicio'}
                </label>
                <input
                  type={isDocumento(tipo) ? 'date' : 'number'}
                  value={valores[tipo] ?? ''}
                  onChange={(e) => setValores((current) => ({ ...current, [tipo]: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                />
              </div>
            ))}

            {submitState.message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-semibold border ${
                  submitState.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                    : 'bg-red-950/40 border-red-700 text-red-300'
                }`}
              >
                {submitState.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 p-4 rounded-xl text-slate-500 font-black text-xs uppercase hover:bg-white/5" disabled={isSubmitting}>Cancelar</button>
              <button 
                onClick={handleGuardar}
                className="flex-1 p-4 bg-blue-600 rounded-xl text-white font-black text-xs uppercase shadow-lg shadow-blue-900/40 disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : `Registrar ${selectedTipos.length > 1 ? 'todo' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}