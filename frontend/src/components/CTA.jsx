// src/components/CTA.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function CTA({ customTitle }) {
  const navigate = useNavigate();

  const handleRegisterNavigation = () => {
    console.log("Navegando a registro..."); // Esto te confirmará que el clic funciona
    navigate("/registro"); 
  };

  return (
    <section className="relative my-20 px-6">
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-12 rounded-[3rem] text-center shadow-2xl overflow-hidden relative">
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10"></div>

        <h2 className="text-3xl md:text-5xl font-black text-white italic mb-6 uppercase tracking-tighter">
          {customTitle || "¿LISTO PARA MANTENER TU MOTO AL DÍA?"}
        </h2>
        
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-medium">
          Únete a la comunidad de RoadKeeper y deja de preocuparte por cuándo fue tu último cambio de aceite.
        </p>
        
        <button 
          onClick={handleRegisterNavigation}
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-900/40 active:scale-95 cursor-pointer relative z-20"
        >
          REGÍSTRATE AHORA
        </button>
      </div>
    </section>
  );
}