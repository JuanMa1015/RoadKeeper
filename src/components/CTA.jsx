import "../styles/cta.css";

export default function CTA() {
  const handleClick = () => {
    window.location.href = "/registro"; // redirige al formulario
  };

  return (
    <section className="cta">
      <h2>¿Listo para mantener tu moto al día?</h2>
      <p>
        Regístrate ahora y lleva un control detallado de tus mantenimientos y
        recordatorios.
      </p>
      <button onClick={handleClick}>Empezar ahora</button>
    </section>
  );
}
