import { useState } from "react";
import "../styles/formulario.css";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    moto: "",
    modelo: "",
    año: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del formulario:", formData);
    alert("✅ Registro enviado correctamente");
  };

  return (
    <div className="register-container">
      <h2>Registro de Usuario y Moto</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label>Nombre completo</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Marca de la moto</label>
          <input
            type="text"
            name="moto"
            value={formData.moto}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Modelo</label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Año</label>
          <input
            type="number"
            name="año"
            value={formData.año}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
