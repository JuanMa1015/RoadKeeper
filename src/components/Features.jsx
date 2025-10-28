import "../styles/features.css";

export default function Features() {
  return (
    <section className="features-section">
      <h2>Funciones principales</h2>
      <div className="features">
        <div className="feature-card">
          <h3>🔔 Recordatorios</h3>
          <p>
            Recibe notificaciones y alertas sobre los mantenimientos y pagos
            pendientes.
          </p>
        </div>
        <div className="feature-card">
          <h3>🛠️ Mantenimientos</h3>
          <p>
            Registra los mantenimientos realizados y próximos según el
            kilometraje de tu moto.
          </p>
        </div>
        <div className="feature-card">
          <h3>📊 Reportes</h3>
          <p>
            Consulta el historial de mantenimientos, facturas y gestos.
          </p>
        </div>
      </div>
    </section>
  );
}
