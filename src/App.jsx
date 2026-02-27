import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Mantenimientos from './pages/Mantenimientos';
import AddMoto from './pages/AddMoto';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
        <Navbar />
        
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} /> {/* <-- Ruta definida en minúsculas */}
            <Route path="/registro" element={<Register />} />
            <Route path="/mantenimientos" element={<Mantenimientos />} />
            <Route path="/add-moto" element={<AddMoto />} />
            
            {/* Ruta de seguridad por si el usuario escribe cualquier cosa mal */}
            <Route path="*" element={<div className="text-center py-20">404 - Página no encontrada</div>} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;