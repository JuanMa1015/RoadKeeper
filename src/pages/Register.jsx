import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

export default function Register() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validación manual en JS
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            await registerUser({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            alert("¡Cuenta creada! Ahora inicia sesión.");
            navigate('/login');
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Crear Cuenta</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    <input type="text" name="username" placeholder="Usuario" required onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />
                    <input type="email" name="email" placeholder="Correo" required onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />
                    <input type="password" name="password" placeholder="Contraseña" required onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />
                    <input type="password" name="confirmPassword" placeholder="Confirmar Contraseña" required onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />

                    <button type="submit" disabled={loading} className="w-full py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-400">
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                        ¿Ya tienes cuenta? Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}