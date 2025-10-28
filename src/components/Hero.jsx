import "../styles/hero.css";
import moto from "../assets/moto.png";

export default function Hero() {
  const handleClick = () => {
    window.location.href = "/registro"; // redirige al formulario
  };

  return (
    <section className="hero">
      <div className="hero-text">
        <h2>
          Sistema de control de <br /> mantenimientos de motos
        </h2>
        <p>
          Gestiona tus mantenimientos y recordatorios de forma fácil y eficiente
        </p>
        <button onClick={handleClick}>Empezar ahora</button>
      </div>
      <div className="hero-img">
        <img src={moto} alt="Moto" />
      </div>
    </section>
  );
}
