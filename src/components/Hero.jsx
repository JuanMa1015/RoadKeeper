import React from 'react';
import { useNavigate } from 'react-router-dom';
import moto from "../assets/moto.png";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-[80vh] flex flex-col md:flex-row items-center justify-between gap-12 py-16">
      <div className="flex-1 space-y-8 text-center md:text-left">
        <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter italic">
          SISTEMA DE <br />
          <span className="text-blue-500">MANTENIMIENTO</span>
        </h2>
        
        <p className="text-slate-400 text-lg max-w-lg mx-auto md:mx-0 font-medium">
          Gestiona tus mantenimientos y recordatorios de forma fácil y eficiente.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <button 
            onClick={() => navigate('/login')} // <-- CORREGIDO: minúsculas
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-900/40 active:scale-95"
          >
            EMPEZAR AHORA
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex justify-center items-center">
        <div className="absolute w-72 h-72 bg-blue-600/20 blur-[120px] rounded-full"></div>
        <img 
          src={moto} 
          alt="Moto RoadKeeper" 
          className="relative w-full max-w-lg h-auto object-contain animate-float drop-shadow-2xl"
        />
      </div>
    </section>
  );
}