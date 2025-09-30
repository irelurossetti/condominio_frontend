// src/pages/Reservations.jsx
import { useEffect, useState } from "react";
import {
  listCommonAreas,
  listReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../services/reservations";

// 👇 --- PASO 1: AÑADE ESTA NUEVA FUNCIÓN DE AYUDA ---
// Convierte una cadena de 'datetime-local' a una cadena ISO en UTC
const localToUTC = (localDateTime) => {
  if (!localDateTime) return "";
  // Crea una fecha que JavaScript interpreta como local
  const date = new Date(localDateTime);
  // .toISOString() SIEMPRE la convierte a formato UTC (con la 'Z')
  return date.toISOString();
};

// Formato de fecha para los inputs 'datetime-local'
const toDateTimeLocal = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function Reservations() {
  const [areas, setAreas] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ area: "", start_time: "", end_time: "" });
  const [msg, setMsg] = useState("");

    async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.area || !form.start_time || !form.end_time) {
      setMsg("Por favor, completa todos los campos.");
      return;
    }

    // 👇 --- PASO 2: CONVIERTE LAS FECHAS ANTES DE ENVIARLAS ---
    const payload = {
      area: form.area,
      start_time: localToUTC(form.start_time),
      end_time: localToUTC(form.end_time),
    };
    
    try {
      if (editingId) {
        // Enviar el payload con las fechas convertidas
        await updateReservation(editingId, payload);
        setMsg("¡Reserva actualizada con éxito!");
      } else {
        // Enviar el payload con las fechas convertidas
        await createReservation(payload);
        setMsg("¡Reserva creada con éxito!");
      }
      cancelEdit();
      loadData();
    } catch (error) {
      console.error(error);
      const backendError = error.response?.data?.non_field_errors?.[0] || "No se pudo guardar la reserva. Revisa los horarios y que no haya conflictos.";
      setMsg(backendError);
    }
  }

  // --- AGENDA ---
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  async function loadData() {
    try {
      const [areasData, reservationsData] = await Promise.all([
        listCommonAreas(),
        listReservations(),
      ]);
      setAreas(areasData.results || areasData);
      setReservations(reservationsData.results || reservationsData);
    } catch (error) {
      console.error(error);
      setMsg("Error al cargar los datos.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Cargar agenda cuando cambian área o fecha (día) seleccionados
  useEffect(() => {
    async function fetchSchedule() {
      if (!form.area || !form.start_time) {
        setSchedule([]);
        return;
      }

      setScheduleLoading(true);
      try {
        const date = form.start_time.split("T")[0]; // YYYY-MM-DD
        const params = { area: form.area, date };
        const data = await listReservations(params);
        setSchedule(data.results || data);
      } catch (error) {
        console.error("Error al cargar la agenda del área", error);
      } finally {
        setScheduleLoading(false);
      }
    }

    fetchSchedule();
  }, [form.area, form.start_time]);

  const handleEdit = (res) => {
    setEditingId(res.id);
    setForm({
      area: res.area,
      start_time: toDateTimeLocal(res.start_time),
      end_time: toDateTimeLocal(res.end_time),
    });
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ area: "", start_time: "", end_time: "" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta reserva?")) {
      try {
        await deleteReservation(id);
        setMsg("Reserva eliminada.");
        loadData();
      } catch (error) {
        console.error(error);
        setMsg("No se pudo eliminar la reserva.");
      }
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.area || !form.start_time || !form.end_time) {
      setMsg("Por favor, completa todos los campos.");
      return;
    }
    try {
      if (editingId) {
        await updateReservation(editingId, form);
        setMsg("¡Reserva actualizada con éxito!");
      } else {
        await createReservation(form);
        setMsg("¡Reserva creada con éxito!");
      }
      cancelEdit();
      loadData();
    } catch (error) {
      console.error(error);
      setMsg("No se pudo guardar la reserva. Revisa los horarios.");
    }
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Reservas de Áreas Comunes</h1>

      {/* Grid: Formulario + Agenda lado a lado */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Columna del Formulario */}
        <div className="card">
          <h3>{editingId ? "Editar Reserva" : "Crear Nueva Reserva"}</h3>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            >
              <option value="">-- Selecciona un área --</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit">{editingId ? "Actualizar" : "Reservar"}</button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary">
                  Cancelar Edición
                </button>
              )}
            </div>

            {msg && (
              <p
                style={{
                  color: /error|no se pudo/i.test(msg) ? "var(--danger)" : "var(--success)",
                  fontWeight: 600,
                }}
              >
                {msg}
              </p>
            )}
          </form>
        </div>

        {/* Columna de la Agenda */}
        <div className="card">
          <h3>Agenda del Día</h3>
          {scheduleLoading ? (
            <p>Cargando agenda...</p>
          ) : !form.area ? (
            <p className="muted">Selecciona un área para ver su agenda.</p>
          ) : schedule.length === 0 ? (
            <p className="muted">No hay reservas para esta fecha.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "8px",
              }}
            >
              {schedule.map((res) => (
                <li
                  key={res.id}
                  style={{
                    background: "var(--neutral-50)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <strong>
                    {new Date(res.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(res.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  <br />
                  <small>Reservado por: {res.user_username}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Tabla de Próximas Reservas */}
      <section>
        <h3>Mis Próximas Reservas</h3>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th>Área</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Hecha el</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{r.area_name}</td>
                <td>{new Date(r.start_time).toLocaleString()}</td>
                <td>{new Date(r.end_time).toLocaleString()}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleEdit(r)}
                    style={{ fontSize: 12, padding: "6px 8px" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      fontSize: 12,
                      padding: "6px 8px",
                      background: "#dc2626",
                      marginLeft: "6px",
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!reservations.length && (
              <tr>
                <td colSpan="5">No tienes reservas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
