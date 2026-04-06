import React, { useState } from 'react';

export default function ServiceModal({ isOpen, onClose, moto, onConfirm }) {
  const [tipo, setTipo] = useState('');
  const [valor, setValor] = useState('');

  if (!isOpen) return null;

  const opciones = [
    { id: 'Aceite', icon: '🛢️', label: 'Aceite', desc: 'Basado en KM' },
    { id: 'Frenos', icon: '🛑', label: 'Frenos', desc: 'Revision KM' },
    { id: 'Kit Arrastre', icon: '⚙️', label: 'Kit Arrastre', desc: 'Revision KM' },
    { id: 'SOAT', icon: '📄', label: 'SOAT', desc: 'Fecha Vencimiento' },
    { id: 'Tecnomecánica', icon: '🛠️', label: 'Tecno', desc: 'Fecha Vencimiento' },
  ];

  const esDocumento = ["SOAT", "Tecnomecánica"].includes(tipo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black text-white italic uppercase mb-2">Gestionar Servicio</h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Máquina: {moto.placa}</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {opciones.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setTipo(opt.id);
                setValor(opt.id.includes('SOAT') || opt.id.includes('Tecno') 
                  ? new Date().toISOString().split('T')[0] 
                  : moto.kilometraje_actual);
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                tipo === opt.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-2xl block mb-1">{opt.icon}</span>
              <p className="font-black text-sm uppercase leading-tight">{opt.label}</p>
              <p className="text-[10px] opacity-60 font-medium">{opt.desc}</p>
            </button>
          ))}
        </div>

        {tipo && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Confirmar {esDocumento ? 'Fecha de Expedición' : 'Kilometraje de Servicio'}
            </label>
            <input 
              type={esDocumento ? "date" : "number"}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-mono outline-none focus:border-blue-500"
            />
            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 p-4 rounded-xl text-slate-500 font-black text-xs uppercase hover:bg-white/5">Cancelar</button>
              <button 
                onClick={() => onConfirm(tipo, valor)}
                className="flex-1 p-4 bg-blue-600 rounded-xl text-white font-black text-xs uppercase shadow-lg shadow-blue-900/40"
              >
                Registrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}