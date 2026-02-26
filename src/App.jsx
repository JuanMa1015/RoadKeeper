import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Mantenimientos from "./pages/Mantenimientos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddMoto from "./pages/AddMoto"; // Asegúrate de que este nombre coincida con tu archivo

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        
        {/* Rutas Protegidas */}
        <Route 
          path="/mantenimientos" 
          element={<PrivateRoute><Mantenimientos /></PrivateRoute>} 
        />
        <Route 
          path="/formulario" 
          element={<PrivateRoute><AddMoto /></PrivateRoute>} 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </Router>
  );
}
