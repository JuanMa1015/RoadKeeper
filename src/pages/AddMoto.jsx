import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMoto } from '../services/motoService';
import { MARCAS_MODELOS } from '../constants/motoData';

export default function AddMoto() {
  const [formData, setFormData] = useState({
    placa: '', marca: '', modelo: '', kilometraje_actual: 0,
    fecha_soat: '', fecha_tecno: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validarPlaca = (placa) => {
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
      // LIMPIEZA DE DATOS PARA FASTAPI
      const dataToSend = {
        placa: formData.placa.toUpperCase().trim(),
        marca: formData.marca,
        modelo: formData.modelo,
        // Convertir a número explícitamente
        kilometraje_actual: Number(formData.kilometraje_actual),
        // Si la fecha está vacía, enviamos null (que FastAPI entiende como None)
        fecha_soat: formData.fecha_soat || null,
        fecha_tecno: formData.fecha_tecno || null
      };

      console.log("Enviando a Neon:", dataToSend);
      await createMoto(dataToSend);
      navigate('/mantenimientos');
    } catch (err) {
      // Para ver el error real del backend en la consola:
      console.error("Detalle del error 400:", err.response?.data);
      setErrors({ server: err.response?.data?.detail || "Error de validación" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
      <h2 className="text-3xl font-black mb-6 text-white italic uppercase tracking-tighter">Registrar Máquina</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Placa</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white focus:border-blue-500 outline-none uppercase font-mono"
            placeholder="Ej: ABC12D"
            onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
            required
          />
          {errors.placa && <p className="text-red-500 text-[10px] mt-2 font-bold">{errors.placa}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Marca</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none"
              onChange={(e) => setFormData({ ...formData, marca: e.target.value, modelo: '' })}
              required
            >
              <option value="">Selecciona Marca</option>
              {Object.keys(MARCAS_MODELOS).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Modelo</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none disabled:opacity-20"
              disabled={!formData.marca}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
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
          <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Kilometraje Actual</label>
          <input
            type="number"
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none"
            onChange={(e) => setFormData({ ...formData, kilometraje_actual: e.target.value })}
            required
          />
        </div>

        {/* Nuevos campos para Documentos Legales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Última Fecha SOAT</label>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none text-xs"
              onChange={(e) => setFormData({ ...formData, fecha_soat: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Última Fecha Tecno</label>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none text-xs"
              onChange={(e) => setFormData({ ...formData, fecha_tecno: e.target.value })}
            />
          </div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20">
          GUARDAR EN MI GARAJE
        </button>
      </form>
    </div>
  );
}