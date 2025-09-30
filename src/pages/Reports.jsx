// condominio_frontend/src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { financeReport } from "../services/reports";
import { fetchMe } from "../services/me";
import { listUsers } from "../services/users";       // ✅ listado para el selector
import FeesChart from "../components/FeesChart";
import ReportSkeleton from "../components/ReportSkeleton"; // ✅ skeleton de carga

function money(n) {
  return `$${(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Tarjeta KPI
function KpiCard({ title, value, className = "" }) {
  return (
    <div className="kpi-card">
      <h4>{title}</h4>
      <p className={`amount ${className}`}>{money(value)}</p>
    </div>
  );
}

export default function Reports() {
  const [me, setMe] = useState(null);

  const [from, setFrom] = useState("");     // YYYY-MM
  const [to, setTo] = useState("");         // YYYY-MM
  const [owner, setOwner] = useState("");   // id de usuario (opcional)

  const [data, setData] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Helpers para meses por defecto (últimos 6 meses, incluyendo el actual) ---
  const computeDefaultMonths = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    return {
      defFrom: sixMonthsAgo.toISOString().slice(0, 7),
      defTo: today.toISOString().slice(0, 7),
    };
  };

  // Carga inicial: usuario y lista de propietarios si es admin + valores por defecto de mes
  useEffect(() => {
    async function loadInitialData() {
      try {
        const meData = await fetchMe();
        setMe(meData);

        const { defFrom, defTo } = computeDefaultMonths();
        setFrom((prev) => prev || defFrom);
        setTo((prev) => prev || defTo);

        if (meData?.profile?.role === "ADMIN") {
          try {
            // Pedimos hasta 1000 usuarios para evitar paginación en el selector
            const usersData = await listUsers("users/?limit=1000");
            setUserList(usersData.results || []);
          } catch (err) {
            console.error("No se pudo cargar la lista de usuarios", err);
          }
        }
      } catch (err) {
        console.error("No se pudo cargar el usuario actual", err);
      }
    }
    loadInitialData();
  }, []);

  // Función para generar el reporte
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Asegura valores por defecto si los inputs están vacíos
      const { defFrom, defTo } = computeDefaultMonths();
      const params = {
        from: from || defFrom,
        to: to || defTo,
        ...(owner ? { owner } : {}),
      };
      const report = await financeReport(params);
      setData(report);
    } catch (err) {
      console.error("Error generando reporte:", err);
      setError("No se pudo generar el reporte. Inténtalo de nuevo.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Genera el reporte al tener `me` listo (y meses por defecto asignados)
  useEffect(() => {
    if (me) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Reporte Financiero</h1>

      <div
        className="card"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
      >
        <input type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="month" value={to} onChange={(e) => setTo(e.target.value)} />

        {/* Selector de propietario solo para ADMIN */}
        {me?.profile?.role === "ADMIN" && (
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">-- Todos los Propietarios --</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.profile?.full_name || u.username}
              </option>
            ))}
          </select>
        )}

        <button onClick={load} disabled={loading}>
          {loading ? "Generando..." : "Generar Reporte"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <button
            onClick={() => alert("Próximamente: Exportar a CSV")}
            disabled={!data || loading}
            style={{ background: "var(--silver-500)" }}
          >
            Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={!data || loading}
            style={{ background: "var(--silver-700)" }}
          >
            Imprimir / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <p style={{ color: "#dc3545", fontWeight: 500 }}>{error}</p>
      ) : !data || !data.overall ? (
        <p>No hay datos para mostrar con los filtros seleccionados.</p>
      ) : (
        <>
          {/* KPIs */}
          <section className="kpi-grid">
            <KpiCard title="Emitido" value={data.overall.issued} className="issued" />
            <KpiCard title="Pagado" value={data.overall.paid} className="paid" />
            <KpiCard title="Pendiente" value={data.overall.outstanding} className="outstanding" />
          </section>

          <section className="card">
            <h3>Desglose por Período</h3>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <FeesChart reportData={data} />
            </div>
          </section>

          <section className="card">
            <h3>Desglose por Tipo de Expensa</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th># Cuotas</th>
                  <th>Emitido</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(data.by_type || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.type}</td>
                    <td>{r.count}</td>
                    <td>{money(r.issued)}</td>
                    <td>{money(r.paid)}</td>
                    <td>{money(r.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
