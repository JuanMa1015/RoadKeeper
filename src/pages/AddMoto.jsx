import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMoto } from '../services/motoService';

export default function AddMoto() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        placa: '',
        marca: '',
        modelo: '',
        kilometraje_actual: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createMoto({
                ...formData,
                placa: formData.placa.toUpperCase(), // Normalizamos la placa
                kilometraje_actual: Number(formData.kilometraje_actual) // Blindaje JS
            });
            alert("Moto registrada con éxito");
            navigate('/mantenimientos'); // Lo devolvemos a su lista de motos
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Registrar Moto</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Placa</label>
                    <input
                        className="w-full p-2 border rounded uppercase"
                        placeholder="ABC12D"
                        maxLength={6}
                        onChange={e => setFormData({...formData, placa: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Ej: Yamaha"
                        onChange={e => setFormData({...formData, marca: e.target.value})}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Modelo</label>
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Ej: MT-03"
                        onChange={e => setFormData({...formData, modelo: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Kilometraje Actual</label>
                    <input
                        className="w-full p-2 border rounded"
                        type="number"
                        min="0"
                        value={formData.kilometraje_actual}
                        onChange={e => setFormData({...formData, kilometraje_actual: e.target.value})}
                        required
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                    {loading ? 'Guardando...' : 'Registrar Moto'}
                </button>
            </form>
        </div>
    );
}