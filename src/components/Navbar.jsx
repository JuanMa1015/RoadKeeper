import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-blue-500 tracking-tighter italic">
          ROADKEEPER
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {['Inicio', 'Recordatorios', 'Mantenimientos', 'Reportes'].map((item) => (
            <Link 
              key={item}
              to={`/${item.toLowerCase()}`}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
          <Link 
            to="/register" 
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-black hover:bg-blue-500 hover:text-white transition-all"
          >
            REGISTRO
          </Link>
        </div>
      </div>
    </nav>
  );
}