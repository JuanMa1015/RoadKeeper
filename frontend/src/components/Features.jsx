const features = [
  { title: 'Recordatorios', desc: 'Notificaciones sobre mantenimientos y pagos.', color: 'from-orange-500/20' },
  { title: 'Mantenimientos', desc: 'Registra servicios según el kilometraje.', color: 'from-blue-500/20' },
  { title: 'Reportes', desc: 'Consulta el historial de gastos y facturas.', color: 'from-emerald-500/20' },
];

export default function Features() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
      {features.map((f, i) => (
        <div key={i} className={`bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] hover:translate-y-[-10px] transition-all duration-300 bg-gradient-to-br ${f.color} to-transparent`}>
          <h3 className="text-xl font-black text-white mb-2 uppercase italic">{f.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">{f.desc}</p>
        </div>
      ))}
    </section>
  );
}