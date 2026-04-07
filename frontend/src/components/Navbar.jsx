import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const navigationItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Recordatorios', to: '/recordatorios' },
  { label: 'Mantenimientos', to: '/mantenimientos' },
  { label: 'Pico y Placa', to: '/pico-placa' },
  { label: 'Reportes', to: '/reportes' },
];

const parseTokenData = () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return { isAuthenticated: false, username: '' };
  }

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('temp_token');
      return { isAuthenticated: false, username: '' };
    }

    return {
      isAuthenticated: true,
      username: payload.sub || 'Usuario',
    };
  } catch {
    sessionStorage.removeItem('token');
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
    sessionStorage.removeItem('token');
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
                className="group h-10 w-10 rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 hover:text-blue-200 hover:border-blue-500/60 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2)] transition-all inline-flex items-center justify-center"
                title="Configuración y Seguridad"
              >
                <span className="transition-transform duration-200 group-hover:scale-110">
                  <SettingsIcon />
                </span>
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