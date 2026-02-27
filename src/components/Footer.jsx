import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900 py-6">
      <div className="max-w-[1400px] mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          © 2026 <span className="text-blue-500 font-bold">RoadKeeper</span>. 
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;