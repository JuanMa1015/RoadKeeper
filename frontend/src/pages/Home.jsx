import React from "react";
// Ya no necesitamos useNavigate aquí porque el componente CTA ya lo maneja internamente
import Hero from "../components/Hero";
import Features from "../components/Features";
import CTA from "../components/CTA";

export default function Home() {
  return (
    <div className="flex flex-col space-y-0">
      {/* 1. Sección de Impacto Inicial */}
      <Hero />

      {/* 2. Sección de Funciones con un contenedor para dar aire */}
      <section className="px-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col items-center mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                Potencia tu <span className="text-blue-500">Control</span>
            </h2>
            <div className="h-1 w-20 bg-blue-600 mt-2 rounded-full"></div>
        </div>
        <Features />
      </section>

      {/* 3. Sección de Cierre con el componente que ya tiene el diseño Pro */}
      <CTA 
        customTitle="GESTIONA TU MOTO DE FORMA FÁCIL, COMIENZA HOY" 
      />
    </div>
  );
}