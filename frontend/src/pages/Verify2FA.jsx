import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verify2FA } from '../services/authService';

export default function Verify2FA() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus al montar y verificar que hay temp_token
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    const tempToken = sessionStorage.getItem('temp_token');
    if (!tempToken) {
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
  }, []);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setCode(value);
    setError('');

    // Auto-submit si se completan 6 dígitos
    if (value.length === 6) {
      handleSubmit(value);
    }
  };

  const handleSubmit = async (codeToSubmit = code) => {
    if (codeToSubmit.length !== 6) {
      setError('Ingresa los 6 dígitos del código');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verify2FA(codeToSubmit);
      navigate('/mantenimientos');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Error al verificar el código';
      setError(detail);
      setCode('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('temp_token');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>

        <h2 className="text-3xl font-black text-center text-white italic uppercase tracking-tighter mb-3 relative z-10">
          Verificación en<br />
          <span className="text-blue-500">Dos Factores</span>
        </h2>

        <p className="text-center text-slate-400 text-sm mb-8 relative z-10">
          Ingresa el código de 6 dígitos de tu aplicación autenticadora.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6 relative z-10"
        >
          {error && (
            <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl uppercase">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-3">
              Código 2FA
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
              placeholder="000000"
              autoComplete="off"
              className="w-full px-4 py-4 text-center tracking-[0.5em] text-xl font-black bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
              value={code}
              onChange={handleCodeChange}
              disabled={loading || !sessionStorage.getItem('temp_token')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                VERIFICANDO...
              </span>
            ) : (
              'VERIFICAR'
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={handleCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
          >
            ← Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}

