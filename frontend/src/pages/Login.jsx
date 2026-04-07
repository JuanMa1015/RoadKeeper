import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await loginUser(username, password);
            
            // Si requiere 2FA, redirigir a la página de verificación
            if (response.requires_2fa) {
                navigate('/verify-2fa');
                return;
            }
            
            // Si no requiere 2FA, ir al garaje
            navigate('/mantenimientos');
        } catch (err) {
            // CORRECCIÓN: Extraer el string del error
            const errorMsg = err.response?.data?.detail || err.message || "Error al conectar con el servidor";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                <h2 className="text-4xl font-black text-center text-white italic uppercase tracking-tighter mb-8">
                    Bienvenido <br />
                    <span className="text-blue-500">RoadKeeper</span>
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {error && (
                        <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl uppercase">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-2">Usuario / Email</label>
                        <input
                            type="text"
                            required
                            placeholder="piloto_01"
                            className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white font-medium"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 text-white bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500"
                    >
                        {loading ? 'AUTENTICANDO...' : 'ENTRAR AL GARAJE'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/registro" className="text-xs font-bold text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
                        ¿No tienes cuenta? <span className="text-blue-500 underline">Regístrate</span>
                    </Link>
                    <br />
                    <Link to="/forgot-password" className="text-xs font-bold text-slate-500 hover:text-amber-400 uppercase tracking-widest transition-colors mt-3 inline-block">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>
        </div>
    );
}

