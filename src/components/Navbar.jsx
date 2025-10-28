import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1>RoadKeeper</h1>
      <ul className="nav-links">
        <li><a href="/">Inicio</a></li>
        <li><a href="#recordatorios">Recordatorios</a></li>
        <li><a href="#mantenimientos">Mantenimientos</a></li>
        <li><a href="#reportes">Reportes</a></li>
        <li><a href="/registro">Registro</a></li>
      </ul>
    </nav>
  );
}
