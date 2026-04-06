import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace de recuperación no es válido o está incompleto.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setMessage('Contraseña actualizada correctamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No fue posible actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>

        <h2 className="text-3xl font-black text-center text-white italic uppercase tracking-tighter mb-3 relative z-10">
          Actualizar<br />
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

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-2">Nueva contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-2">Confirmar nueva contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-900/40 active:scale-95"
          >
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
