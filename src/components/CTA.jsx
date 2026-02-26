import { useNavigate } from "react-router-dom";
import "../styles/cta.css";

export default function CTA({ customTitle }) {
  const navigate = useNavigate();

  const handleRegisterNavigation = () => {
    navigate("/registro");
  };

  return (
    <section className="cta">
      <h2>{customTitle || "¿Listo para mantener tu moto al día?"}</h2>
      <p>
        Regístrate ahora y lleva un control detallado de tus mantenimientos y
        recordatorios.
      </p>
      <button onClick={handleRegisterNavigation} className="cta-button">
        Empezar ahora
      </button>
    </section>
  );
}