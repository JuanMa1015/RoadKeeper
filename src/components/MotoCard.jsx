import React from 'react';

export default function MotoCard({ moto, progreso, onUpdateKm }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] hover:border-blue-500/40 transition-all duration-500 group animate-fade-in-up shadow-2xl">
      {/* Header de la Card */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <span className="text-blue-500 font-mono text-[10px] font-black tracking-[0.3em] uppercase">Placa</span>
          <h3 className="text-3xl font-black text-white italic tracking-tighter">{moto.placa}</h3>
          <p className="text-slate-500 text-xs font-bold uppercase mt-1">{moto.marca} {moto.modelo}</p>
        </div>
        <div className="bg-slate-800 p-3 rounded-2xl group-hover:bg-blue-600/20 transition-colors">
          <span className="text-2xl">🏍️</span>
        </div>
      </div>

      {/* Barra de Progreso Inteligente */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
            <span className="text-slate-400">Vida útil Aceite</span>
            <span className={progreso > 85 ? "text-red-500" : "text-blue-400"}>
              {progreso}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-[2px]">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                progreso > 85 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'
              }`}
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>

        {/* Footer de la Card */}
        <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-black">Odometer</p>
            <p className="text-xl font-mono font-black text-white tracking-tighter">
              {moto.kilometraje_actual.toLocaleString()} <span className="text-[10px] text-slate-500">KM</span>
            </p>
          </div>
          <button 
            onClick={() => onUpdateKm(moto.id, moto.kilometraje_actual)}
            className="bg-slate-800 hover:bg-blue-600 text-white p-3 rounded-xl transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}