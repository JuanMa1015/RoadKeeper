import { useState } from 'react';
import api from '../api/axios';

export default function MotoCard({ moto, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newKm, setNewKm] = useState(moto.kilometraje_actual);
    const [updating, setUpdating] = useState(false);

    // Debate: Umbral de mantenimiento. En el futuro, esto podría venir de la DB
    const LIMITE_ACEITE = 5000;
    const necesitaAtencion = moto.kilometraje_actual >= LIMITE_ACEITE;

    const handleUpdate = async () => {
        if (newKm < moto.kilometraje_actual) {
            alert("¡Error! El kilometraje no puede ser menor al actual.");
            return;
        }

        setUpdating(true);
        try {
            const response = await api.patch(`/motos/${moto.id}/kilometraje?nuevo_km=${newKm}`);
            onUpdate(response.data);
            setIsEditing(false);
        } catch (err) {
            alert(err.response?.data?.detail || "Error al actualizar");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 ${
            necesitaAtencion ? 'border-red-200 bg-red-50' : 'border-white bg-white hover:shadow-xl'
        }`}>
            {/* Indicador de estado */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-lg uppercase ${
                necesitaAtencion ? 'bg-red-500 animate-pulse' : 'bg-green-500'
            }`}>
                {necesitaAtencion ? 'Revisión Necesaria' : 'Al día'}
            </div>

            <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter">{moto.placa}</h2>
                <p className="text-gray-500 font-medium">{moto.marca} <span className="text-gray-300">|</span> {moto.modelo}</p>
            </div>

            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Kilometraje</p>
                    {isEditing ? (
                        <input 
                            type="number" 
                            className="bg-transparent text-xl font-black text-blue-600 w-24 outline-none border-b-2 border-blue-600"
                            value={newKm}
                            onChange={(e) => setNewKm(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <p className="text-xl font-black text-gray-800">{moto.kilometraje_actual.toLocaleString()} <span className="text-xs font-normal">KM</span></p>
                    )}
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <button 
                            onClick={handleUpdate}
                            disabled={updating}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                        >
                            {updating ? '...' : '✓'}
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}