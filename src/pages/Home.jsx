import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import Features from "../components/Features";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Hero />
      <Features />
      <section className="cta">
        <h3>Gestiona tu moto de forma fácil, comienza hoy</h3>
        <p>
          Comienza a gestionar los mantenimientos y recordatorios de tu moto y mejora la organización
        </p>
        <button onClick={() => navigate("/formulario")}>
          Empezar ahora
        </button>
      </section>
    </>
  );
}
