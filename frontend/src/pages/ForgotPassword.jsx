import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage('Revisa tu correo. Te enviamos un enlace para actualizar tu contraseña.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>

        <h2 className="text-3xl font-black text-center text-white italic uppercase tracking-tighter mb-3 relative z-10">
          Recuperar<br />
          <span className="text-blue-500">Contraseña</span>
        </h2>

        {message && (
          <div className="p-4 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6 relative z-10">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 relative z-10">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-6 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-2">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              required
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <p className="text-slate-400 text-sm">
            Ingresa tu correo registrado y te enviaremos un enlace para actualizar tu contraseña desde el email.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95"
          >
            {loading ? 'Procesando...' : 'Enviar correo de recuperación'}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
          >
            ← Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
