import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService'; // 1. IMPORTANTE: Importar el servicio

export default function Register() {
  // 2. Agregamos 'username' al estado inicial
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => { // 3. Debe ser async
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      // 4. LLAMADA REAL AL BACKEND
      await registerUser(formData); 
      console.log("¡Registrado en Neon con éxito!");
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || err || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl mt-10">
      <h2 className="text-4xl font-black text-white italic mb-8 uppercase tracking-tighter text-center">Crear Cuenta</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl uppercase">
            {error}
          </div>
        )}

        {/* 5. NUEVO CAMPO: USERNAME (Obligatorio para tu Backend) */}
        <div>
          <label className="block text-slate-500 text-xs font-black uppercase mb-2 ml-1">Nombre de Usuario</label>
          <input 
            type="text" 
            required
            placeholder="ej: piloto_01"
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-slate-500 text-xs font-black uppercase mb-2 ml-1">Email</label>
          <input 
            type="email" 
            required
            placeholder="correo@ejemplo.com"
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

        <button 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          {loading ? 'PROCESANDO...' : 'REGISTRARME EN LA NUBE'}
        </button>
      </form>
    </div>
  );
}