import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMoto } from '../services/motoService';
import { MARCAS_MODELOS } from '../constants/motoData';

export default function AddMoto() {
  const [formData, setFormData] = useState({ placa: '', marca: '', modelo: '', kilometraje_actual: 0 });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validarPlaca = (placa) => {
    // Ejemplo para placa colombiana o estándar: 3 letras y 3 caracteres alfanuméricos
    const regex = /^[A-Z]{3}[0-9A-Z]{2,3}$/;
    return regex.test(placa.toUpperCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarPlaca(formData.placa)) {
      setErrors({ placa: "Formato de placa inválido (Ej: ABC12D)" });
      return;
    }
    try {
      await createMoto({ ...formData, placa: formData.placa.toUpperCase() });
      navigate('/mantenimientos');
    } catch (err) {
      setErrors({ server: err });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
      <h2 className="text-3xl font-black mb-6 text-white text-center">Registrar Nueva Moto</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Placa */}
        <div>
          <label className="block text-slate-400 text-sm font-bold mb-2">PLACA</label>
          <input 
            type="text"
            className={`w-full bg-slate-900 border ${errors.placa ? 'border-red-500' : 'border-slate-700'} p-4 rounded-xl focus:outline-none focus:border-blue-500 uppercase`}
            placeholder="Ej: ABC12D"
            onChange={(e) => setFormData({...formData, placa: e.target.value})}
            required
          />
          {errors.placa && <p className="text-red-500 text-xs mt-2">{errors.placa}</p>}
        </div>

        {/* Select Marca */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">MARCA</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none"
              onChange={(e) => setFormData({...formData, marca: e.target.value, modelo: ''})}
              required
            >
              <option value="">Selecciona Marca</option>
              {Object.keys(MARCAS_MODELOS).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Select Modelo Dependiente */}
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">MODELO</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none disabled:opacity-30"
              disabled={!formData.marca}
              onChange={(e) => setFormData({...formData, modelo: e.target.value})}
              required
            >
              <option value="">Selecciona Modelo</option>
              {formData.marca && MARCAS_MODELOS[formData.marca].map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm font-bold mb-2">KILOMETRAJE ACTUAL</label>
          <input 
            type="number"
            className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none"
            onChange={(e) => setFormData({...formData, kilometraje_actual: e.target.value})}
            required
          />
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all">
          GUARDAR EN MI GARAJE
        </button>
      </form>
    </div>
  );
}