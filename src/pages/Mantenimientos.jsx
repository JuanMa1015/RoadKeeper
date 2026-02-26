import { useEffect, useState } from 'react';
import { getMotos } from '../services/motoService';
import MotoCard from '../components/MotoCard';
import { useNavigate } from 'react-router-dom';

export default function Mantenimientos() {
    const [motos, setMotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMotos = async () => {
            try {
                const data = await getMotos();
                setMotos(data);
            } catch (err) {
                console.error("Error cargando motos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMotos();
    }, []);

    // Lógica para el resumen (Reporte rápido)
    const motosConAlerta = motos.filter(m => m.kilometraje_actual >= 5000).length;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Cabecera y Resumen */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Mis Vehículos</h1>
                        <p className="text-gray-600">Gestiona el kilometraje y alertas de mantenimiento.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/formulario')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                        + Registrar Nueva Moto
                    </button>
                </div>

                {/* Tarjetas de Reporte Rápido */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-b-4 border-blue-500">
                        <p className="text-gray-500 text-sm font-bold uppercase">Total Motos</p>
                        <p className="text-3xl font-black">{motos.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-b-4 border-red-500">
                        <p className="text-gray-500 text-sm font-bold uppercase">En Alerta</p>
                        <p className="text-3xl font-black text-red-600">{motosConAlerta}</p>
                    </div>
                </div>

                {/* Listado de Motos */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600 font-medium">Conectando con Neon...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {motos.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">No hay motos en tu garaje virtual.</p>
                                <button 
                                    onClick={() => navigate('/formulario')}
                                    className="text-blue-600 font-bold hover:underline"
                                >
                                    ¡Empieza registrando una ahora!
                                </button>
                            </div>
                        ) : (
                            motos.map(moto => (
                                <MotoCard 
                                    key={moto.id} 
                                    moto={moto} 
                                    onUpdate={(updatedMoto) => {
                                        // Actualización reactiva del estado local
                                        setMotos(motos.map(m => m.id === updatedMoto.id ? updatedMoto : m));
                                    }} 
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}