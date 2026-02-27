import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    console.log("Datos de registro:", formData);
    // Aquí iría tu llamada al backend
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl mt-10">
      <h2 className="text-4xl font-black text-white italic mb-8 uppercase tracking-tighter text-center">Crear Cuenta</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-slate-500 text-xs font-black uppercase mb-2 ml-1">Email</label>
          <input 
            type="email" 
            required
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-slate-500 text-xs font-black uppercase mb-2 ml-1">Contraseña</label>
          <input 
            type="password" 
            required
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-slate-500 text-xs font-black uppercase mb-2 ml-1">Confirmar Contraseña</label>
          <input 
            type="password" 
            required
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20">
          REGISTRARME
        </button>
      </form>
    </div>
  );
}