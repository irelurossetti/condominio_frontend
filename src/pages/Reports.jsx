// condominio_frontend/src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { financeReport } from "../services/reports";
import { fetchMe } from "../services/me";
import FeesChart from '../components/FeesChart';
import ReportSkeleton from '../components/ReportSkeleton'; // <-- 1. Importa el Skeleton

function money(n){ return `$${(n??0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`; }

// <-- 2. Crea el componente KPI Card
function KpiCard({ title, value, className = '' }) {
    return (
        <div className="kpi-card">
            <h4>{title}</h4>
            <p className={`amount ${className}`}>{money(value)}</p>
        </div>
    );
}

export default function Reports(){
  const [me, setMe] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [owner, setOwner] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  async function load(){
    if (!me) return;
    setLoading(true);
    setError(null);
    try{
      const params = {
        from: from || undefined,
        to: to || undefined,
        owner: me.profile?.role === 'ADMIN' ? (owner.trim() || undefined) : me.id
      };
      const d = await financeReport(params);
      setData(d);
    } catch (err) {
        console.error("Fallo al cargar el reporte:", err);
        setError("No se pudo generar el reporte. Por favor, intenta de nuevo.");
        setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    if(me) load();
  }, [me]);

  return (
    <div style={{ padding: 24, display:"grid", gap:24 }}>
      <h1>Reporte Financiero</h1>
      <div className="card" style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems: "center" }}>
        <input type="month" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="month" value={to} onChange={e=>setTo(e.target.value)} />
        {me?.profile?.role === 'ADMIN' && (
          <input placeholder="Filtrar por ID de Propietario" value={owner} onChange={e=>setOwner(e.target.value)} />
        )}
        <button onClick={load} disabled={loading}>{loading ? "Generando..." : "Generar Reporte"}</button>
       
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}></div>
            <button
                onClick={() => alert('Próximamente: Exportar a CSV')}
                disabled={!data || loading}
                style={{ background: 'var(--silver-500)' }}
            >
                Exportar CSV
           </button>
           <button
                onClick={() => window.print()}
                disabled={!data || loading}
                style={{ background: 'var(--silver-700)' }}
        >
            Imprimir / PDF
        </button>
      </div>              
      {loading ? (
        <ReportSkeleton /> // <-- 3. Usa el Skeleton
      ) : error ? (
        <p style={{ color: '#dc3545', fontWeight: 500 }}>{error}</p>
      ) : !data || !data.overall ? (
        <p>No hay datos para mostrar con los filtros seleccionados.</p>
      ) : (
        <>
          {/* --- 👇 4. Usa las KPI Cards --- */}
          <section className="kpi-grid">
              <KpiCard title="Emitido" value={data.overall.issued} className="issued" />
              <KpiCard title="Pagado" value={data.overall.paid} className="paid" />
              <KpiCard title="Pendiente" value={data.overall.outstanding} className="outstanding" />
          </section>

          <section className="card">
            <h3>Desglose por Período</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              <FeesChart reportData={data} />
            </div>
          </section>

          <section className="card">
            <h3>Desglose por Tipo de Expensa</h3>
            <table className="table">
              <thead><tr><th>Tipo</th><th># Cuotas</th><th>Emitido</th><th>Pagado</th><th>Pendiente</th></tr></thead>
              <tbody>
                {data.by_type.map((r,i) => <tr key={i}><td>{r.type}</td><td>{r.count}</td><td>{money(r.issued)}</td><td>{money(r.paid)}</td><td>{money(r.outstanding)}</td></tr>)}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}