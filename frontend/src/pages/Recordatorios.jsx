import { useMemo, useState } from 'react';
import { useRecordatorios } from '../hooks/useRecordatorios';

const TAB_OPTIONS = [
  { id: 'todos', label: 'Todos' },
  { id: 'revisiones', label: 'Revisiones' },
  { id: 'documentos', label: 'Documentación legal' },
];

const CATEGORY_STYLES = {
  revisiones: {
    label: 'Revisiones',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  documentos: {
    label: 'Documentación legal',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
};

function getDiasRestantes(fechaVencimiento) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${fechaVencimiento}T00:00:00`);
  const diffMs = dueDate.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgencia(diasRestantes) {
  if (diasRestantes <= 7) {
    return {
      key: 'rojo',
      label: diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)} días` : `Vence en ${diasRestantes} días`,
      textColor: 'text-red-300',
      borderColor: 'border-l-red-500',
      dotColor: 'bg-red-500',
    };
  }
  if (diasRestantes <= 30) {
    return {
      key: 'amarillo',
      label: `Vence en ${diasRestantes} días`,
      textColor: 'text-amber-300',
      borderColor: 'border-l-amber-400',
      dotColor: 'bg-amber-400',
    };
  }
  return {
    key: 'verde',
    label: `Al día (${diasRestantes} días restantes)`,
    textColor: 'text-emerald-300',
    borderColor: 'border-l-emerald-500',
    dotColor: 'bg-emerald-500',
  };
}

function formatDateEsCo(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function ToolIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 1 0 3 3l-5.5 5.5a2 2 0 0 1-2.8 0l-.2-.2a2 2 0 0 1 0-2.8L14.7 6.3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m17 4 3 3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
    </svg>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-2xl bg-slate-800/70" />
        ))}
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-10 w-36 rounded-xl bg-slate-800/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-44 rounded-2xl bg-slate-800/70" />
        ))}
      </div>
    </div>
  );
}

export default function Recordatorios() {
  const [activeTab, setActiveTab] = useState('todos');
  const { recordatorios, loading, error, refetch } = useRecordatorios();

  const withMeta = useMemo(() => {
    return recordatorios.map((item) => {
      const diasRestantes = getDiasRestantes(item.fecha_vencimiento);
      return {
        ...item,
        diasRestantes,
        urgencia: getUrgencia(diasRestantes),
      };
    });
  }, [recordatorios]);

  const metrics = useMemo(() => {
    return withMeta.reduce(
      (acc, item) => {
        if (item.diasRestantes <= 7) {
          acc.rojo += 1;
        } else if (item.diasRestantes <= 30) {
          acc.amarillo += 1;
        } else {
          acc.verde += 1;
        }
        return acc;
      },
      { rojo: 0, amarillo: 0, verde: 0 }
    );
  }, [withMeta]);

  const filteredRecordatorios = useMemo(() => {
    if (activeTab === 'todos') return withMeta;
    return withMeta.filter((item) => item.tipo === activeTab);
  }, [activeTab, withMeta]);

  return (
    <section className="space-y-6 text-slate-100">
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Recordatorios</h1>
        <p className="text-slate-400 mt-2">Controla revisiones y documentación legal de tus motos en un solo tablero.</p>
      </header>

      {loading ? (
        <SkeletonLoader />
      ) : error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6">
          <p className="text-red-300 font-semibold">No fue posible cargar los recordatorios.</p>
          <p className="text-red-200/80 text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 rounded-xl bg-red-500 hover:bg-red-400 text-white px-4 py-2 font-semibold transition"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <p className="text-red-200 text-sm">Vencidos / urgentes</p>
              <p className="text-3xl font-black text-red-300 mt-2">{metrics.rojo}</p>
            </article>
            <article className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
              <p className="text-amber-100 text-sm">Próximos a vencer</p>
              <p className="text-3xl font-black text-amber-300 mt-2">{metrics.amarillo}</p>
            </article>
            <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-emerald-100 text-sm">Al día</p>
              <p className="text-3xl font-black text-emerald-300 mt-2">{metrics.verde}</p>
            </article>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-800/60 p-2 border border-slate-700">
            {TAB_OPTIONS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {filteredRecordatorios.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-slate-200 font-semibold">No hay recordatorios para este filtro.</p>
              <p className="text-slate-400 text-sm mt-1">Crea recordatorios de revisiones o documentos para verlos aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecordatorios.map((recordatorio) => {
                const category = CATEGORY_STYLES[recordatorio.tipo] || CATEGORY_STYLES.revisiones;
                return (
                  <article
                    key={recordatorio.id}
                    className={`rounded-2xl border border-slate-700 bg-slate-800/70 p-5 border-l-4 ${recordatorio.urgencia.borderColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-100">
                        <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-700/90">
                          {recordatorio.tipo === 'documentos' ? <DocumentIcon /> : <ToolIcon />}
                        </span>
                        <div>
                          <h2 className="font-bold text-lg leading-tight">{recordatorio.titulo}</h2>
                          <p className="text-slate-400 text-sm">{recordatorio.moto_nombre}</p>
                        </div>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${category.badge}`}>
                        {category.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-400">Vencimiento: </span>
                        {formatDateEsCo(recordatorio.fecha_vencimiento)}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${recordatorio.urgencia.dotColor}`} />
                        <p className={`font-semibold ${recordatorio.urgencia.textColor}`}>{recordatorio.urgencia.label}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const detalle = recordatorio.descripcion || 'Sin descripción adicional.';
                        window.alert(`${recordatorio.titulo}\n\nMoto: ${recordatorio.moto_nombre}\n\n${detalle}`);
                      }}
                      className="mt-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 text-sm font-semibold transition"
                    >
                      Ver detalles
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

