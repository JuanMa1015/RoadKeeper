import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import SessionWatcher from './components/SessionWatcher';
import NotificationPushWatcher from './components/NotificationPushWatcher';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Mantenimientos from './pages/Mantenimientos';
import AddMoto from './pages/AddMoto';
import Recordatorios from './pages/Recordatorios';
import Reportes from './pages/Reportes';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Verify2FA from './pages/Verify2FA';
import Configuracion from './pages/Configuracion';
import PicoPlaca from './pages/PicoPlaca';

function App() {
  return (
    <Router>
      <SessionWatcher />
      <NotificationPushWatcher />
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
        <Navbar />
        
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inicio" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-2fa" element={<Verify2FA />} />
            <Route path="/registro" element={<Register />} />
            <Route
              path="/mantenimientos"
              element={
                <ProtectedRoute>
                  <Mantenimientos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recordatorios"
              element={
                <ProtectedRoute>
                  <Recordatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <Reportes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pico-placa"
              element={
                <ProtectedRoute>
                  <PicoPlaca />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-moto"
              element={
                <ProtectedRoute>
                  <AddMoto />
                </ProtectedRoute>
              }
            />
            
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

// ROADKEEPER - modificado por Copilot 2026-04-06

