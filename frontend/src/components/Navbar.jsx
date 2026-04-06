import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const navigationItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Recordatorios', to: '/recordatorios' },
  { label: 'Mantenimientos', to: '/mantenimientos' },
  { label: 'Reportes', to: '/reportes' },
];

const parseTokenData = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { isAuthenticated: false, username: '' };
  }

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('temp_token');
      return { isAuthenticated: false, username: '' };
    }

    return {
      isAuthenticated: true,
      username: payload.sub || 'Usuario',
    };
  } catch {
    localStorage.removeItem('token');
    sessionStorage.removeItem('temp_token');
    return { isAuthenticated: false, username: '' };
  }
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(parseTokenData());

  useEffect(() => {
    setAuth(parseTokenData());
  }, [location.pathname]);

  useEffect(() => {
    const onStorageChange = () => setAuth(parseTokenData());
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('temp_token');
    setAuth({ isAuthenticated: false, username: '' });
    navigate('/login');
  };

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-blue-500 tracking-tighter italic">
          ROADKEEPER
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          
          {auth.isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <Link
                to="/configuracion"
                className="h-10 w-10 rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 transition-all inline-flex items-center justify-center"
                title="Configuración y Seguridad"
              >
                ⚙️
              </Link>

              <div className="px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold max-w-[180px] truncate">
                {auth.username}
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-all text-xs font-bold tracking-wide"
              >
                SALIR
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <Link
                to="/login"
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-black hover:bg-blue-500 hover:text-white transition-all"
              >
                LOGIN
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}