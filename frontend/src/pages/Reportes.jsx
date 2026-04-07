import { useEffect, useMemo, useState } from 'react';
import { getMotos } from '../services/motoService';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function getDocumentStatus(tipo, fecha) {
  if (!['SOAT', 'Tecnomecánica'].includes(tipo)) return 'N/A';
  if (!fecha) return 'Sin fecha';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(fecha);
  if (Number.isNaN(due.getTime())) return 'Sin fecha';
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Vencido (${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'Vence mañana';
  if (diffDays <= 30) return `Proximo (${diffDays}d)`;
  return `Al dia (${diffDays}d)`;
}

export default function Reportes() {
  const [motos, setMotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modoVista, setModoVista] = useState('actuales');
  const [filtroPlaca, setFiltroPlaca] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMotos();
        setMotos(Array.isArray(data) ? data : []);
      } catch (err) {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'No se pudieron cargar los reportes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allMantenimientos = useMemo(() => {
    return motos
      .flatMap((moto) =>
        (moto.mantenimientos || []).map((mant) => ({
          id: mant.id,
          placa: moto.placa,
          marca: moto.marca,
          modelo: moto.modelo,
          tipo: mant.tipo,
          fecha: mant.fecha_servicio || mant.fecha,
          km: mant.km_momento_servicio,
        }))
      )
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [motos]);

  const mantenimientosSinDuplicados = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const item of allMantenimientos) {
      const key = [
        item.placa,
        item.tipo,
        item.fecha || '',
        item.km ?? '',
      ].join('|');

      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }

    return unique;
  }, [allMantenimientos]);

  const mantenimientosActuales = useMemo(() => {
    const latestByMotoTipo = new Map();

    for (const item of mantenimientosSinDuplicados) {
      const key = `${item.placa}|${item.tipo}`;
      const existing = latestByMotoTipo.get(key);

      if (!existing) {
        latestByMotoTipo.set(key, item);
        continue;
      }

      const itemTime = new Date(item.fecha || 0).getTime();
      const existingTime = new Date(existing.fecha || 0).getTime();
      if (itemTime > existingTime) {
        latestByMotoTipo.set(key, item);
      }
    }

    return Array.from(latestByMotoTipo.values()).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [mantenimientosSinDuplicados]);

  const baseFiltrado = modoVista === 'actuales' ? mantenimientosActuales : mantenimientosSinDuplicados;

  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(baseFiltrado.map((item) => item.tipo))).sort();
  }, [baseFiltrado]);

  const filasFiltradas = useMemo(() => {
    return baseFiltrado.filter((item) => {
      const okPlaca = filtroPlaca === 'todas' || item.placa === filtroPlaca;
      const okTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
      return okPlaca && okTipo;
    });
  }, [baseFiltrado, filtroPlaca, filtroTipo]);

  const metricas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const docsProximos = mantenimientosActuales.filter((item) => {
      if (!['SOAT', 'Tecnomecánica'].includes(item.tipo) || !item.fecha) return false;
      const d = new Date(item.fecha);
      const diff = Math.floor((d - hoy) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length;

    return {
      motos: motos.length,
      registrosActuales: mantenimientosActuales.length,
      registrosHistoricos: mantenimientosSinDuplicados.length,
      docsProximos,
      ultimoRegistro: mantenimientosSinDuplicados[0]?.fecha || null,
    };
  }, [mantenimientosActuales, mantenimientosSinDuplicados, motos.length]);

  const exportarCSV = () => {
    const sep = ';';
    const bom = '\uFEFF';
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const header = [
      'fecha_reporte',
      'vista',
      'placa',
      'moto',
      'tipo',
      'fecha',
      'km',
      'estado_documento',
    ];

    const fechaReporte = new Date().toLocaleString('es-CO');
    const vista = modoVista === 'actuales' ? 'Solo actuales' : 'Historial';

    const rows = filasFiltradas.map((item) => [
      fechaReporte,
      vista,
      item.placa,
      `${item.marca} ${item.modelo}`,
      item.tipo,
      formatDate(item.fecha),
      Number(item.km ?? 0).toLocaleString('es-CO'),
      getDocumentStatus(item.tipo, item.fecha),
    ]);

    const csv = bom + [header, ...rows]
      .map((row) => row.map(escapeCsv).join(sep))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${modoVista}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportarResumenCSV = () => {
    const sep = ';';
    const bom = '\uFEFF';
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const fechaReporte = new Date().toLocaleString('es-CO');
    const vista = modoVista === 'actuales' ? 'Solo actuales' : 'Historial';

    const rows = [
      ['fecha_reporte', 'vista', 'motos_registradas', 'registros_actuales', 'historico_sin_duplicados', 'documentos_por_vencer_30d', 'ultimo_registro'],
      [fechaReporte, vista, metricas.motos, metricas.registrosActuales, metricas.registrosHistoricos, metricas.docsProximos, formatDate(metricas.ultimoRegistro)],
      [],
      ['placa', 'moto', 'tipo', 'estado_documento', 'fecha', 'km'],
      ...filasFiltradas.map((item) => [
        item.placa,
        `${item.marca} ${item.modelo}`,
        item.tipo,
        getDocumentStatus(item.tipo, item.fecha),
        formatDate(item.fecha),
        Number(item.km ?? 0).toLocaleString('es-CO'),
      ]),
    ];

    const csv = bom + rows.map((row) => row.map(escapeCsv).join(sep)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-resumen-${modoVista}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => {
    try {
      setExportingPdf(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const nowLabel = new Date().toLocaleString('es-CO');

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 88, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('RoadKeeper | Reporte de mantenimientos', 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(191, 219, 254);
      doc.text(`Generado: ${nowLabel}`, 40, 60);
      doc.text(`Vista: ${modoVista === 'actuales' ? 'Solo actuales' : 'Historial'} | Filtros: placa=${filtroPlaca}, tipo=${filtroTipo}`, 40, 74);

      autoTable(doc, {
        startY: 102,
        head: [['Indicador', 'Valor']],
        body: [
          ['Motos registradas', String(metricas.motos)],
          ['Registros actuales', String(metricas.registrosActuales)],
          ['Historico sin duplicados', String(metricas.registrosHistoricos)],
          ['Documentos por vencer (30d)', String(metricas.docsProximos)],
          ['Ultimo registro', formatDate(metricas.ultimoRegistro)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 },
        margin: { left: 40, right: 40 },
      });

      const tableRows = filasFiltradas.map((item) => [
        item.placa,
        `${item.marca} ${item.modelo}`,
        item.tipo,
        formatDate(item.fecha),
        Number(item.km ?? 0).toLocaleString('es-CO'),
        getDocumentStatus(item.tipo, item.fecha),
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Placa', 'Moto', 'Tipo', 'Fecha', 'KM', 'Estado documento']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8.5 },
        margin: { left: 40, right: 40 },
      });

      doc.save(`reporte-${modoVista}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-700 bg-slate-800/40 p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white">Reportes</h1>
        <p className="text-slate-400 mt-2">Por defecto ves solo el estado actual por tipo y moto. Puedes cambiar a historial completo.</p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400 uppercase">Motos registradas</p>
          <p className="text-3xl font-black text-white mt-1">{metricas.motos}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400 uppercase">Registros actuales</p>
          <p className="text-3xl font-black text-white mt-1">{metricas.registrosActuales}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs text-amber-200 uppercase">Documentos por vencer (30d)</p>
          <p className="text-3xl font-black text-amber-300 mt-1">{metricas.docsProximos}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400 uppercase">Histórico sin duplicados</p>
          <p className="text-lg font-black text-white mt-2">{metricas.registrosHistoricos}</p>
        </div>
      </div>

      <article className="rounded-3xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
        <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-1">
          <button
            onClick={() => setModoVista('actuales')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${modoVista === 'actuales' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Solo actuales
          </button>
          <button
            onClick={() => setModoVista('historial')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${modoVista === 'historial' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Historial
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filtroPlaca}
            onChange={(e) => setFiltroPlaca(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
          >
            <option value="todas">Todas las placas</option>
            {motos.map((moto) => (
              <option key={moto.id} value={moto.placa}>{moto.placa}</option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
          >
            <option value="todos">Todos los tipos</option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <button
            onClick={exportarCSV}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2"
          >
            CSV detalle ({modoVista === 'actuales' ? 'actuales' : 'historial'})
          </button>

          <button
            onClick={exportarResumenCSV}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2"
          >
            CSV resumen
          </button>

          <button
            onClick={exportarPDF}
            disabled={exportingPdf}
            className="rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2"
          >
            {exportingPdf ? 'Generando PDF...' : 'Exportar PDF'}
          </button>
        </div>

        {filasFiltradas.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay datos para los filtros actuales.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="text-left px-4 py-3">Placa</th>
                  <th className="text-left px-4 py-3">Moto</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">KM</th>
                  <th className="text-left px-4 py-3">Estado doc</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.map((item) => (
                  <tr key={`${item.id}-${item.placa}`} className="border-t border-slate-700/70 text-slate-200">
                    <td className="px-4 py-3 font-semibold">{item.placa}</td>
                    <td className="px-4 py-3">{item.marca} {item.modelo}</td>
                    <td className="px-4 py-3">{item.tipo}</td>
                    <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                    <td className="px-4 py-3">{(item.km ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{getDocumentStatus(item.tipo, item.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
