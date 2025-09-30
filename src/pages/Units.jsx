// src/pages/Units.jsx
import { useEffect, useState } from "react";
import { listUnits, createUnit, updateUnit, deleteUnit, getUnitDetails } from "../services/units";
import { listUsers } from "../services/users";
import { toast } from 'react-hot-toast';
import UnitModal from '../components/UnitModal';
import UnitDetailModal from '../components/UnitDetailModal';
import { useDebounce } from "../hooks/useDebounce";

export default function Units() {
  const [rows, setRows] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const debouncedSearchTerm = useDebounce(q, 500);

  // Estados para los Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailedUnitData, setDetailedUnitData] = useState(null);

  // Un solo useEffect para cargar todos los datos, se activa con la búsqueda
  useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            // Carga las unidades y los usuarios en paralelo para mayor eficiencia
            const [unitsData, usersData] = await Promise.all([
                listUnits({ search: debouncedSearchTerm }),
                listUsers()
            ]);
            setRows(unitsData.results || unitsData);
            
            const ownerList = (usersData.results || usersData).map(u => ({
              id: u.id,
              label: `${u.profile?.full_name || u.username} (@${u.username})`,
            }));
            setOwners(ownerList);
        } catch (e) {
            toast.error("No se pudo cargar la información.");
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [debouncedSearchTerm]); // Se vuelve a ejecutar solo cuando el término de búsqueda "debounced" cambia

  const handleOpenEditModal = (unit = null) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };
  
  const handleViewDetails = async (unitId) => {
    const toastId = toast.loading('Cargando detalles...');
    try {
        const data = await getUnitDetails(unitId);
        setDetailedUnitData(data);
        setIsDetailModalOpen(true);
    } catch (error) {
        toast.error("No se pudieron cargar los detalles.");
    } finally {
        toast.dismiss(toastId);
    }
  };

  const refreshUnits = async () => {
    const unitsData = await listUnits({ search: debouncedSearchTerm });
    setRows(unitsData.results || unitsData);
  };

  const handleSave = async (unitData) => {
    const toastId = toast.loading('Guardando...');
    try {
      if (unitData.id) {
        await updateUnit(unitData.id, unitData);
        toast.success("Unidad actualizada.");
      } else {
        await createUnit(unitData);
        toast.success("Unidad creada.");
      }
      setIsEditModalOpen(false);
      await refreshUnits(); // Refresca la lista
    } catch (e) {
      toast.error("Error al guardar la unidad.");
    } finally {
        toast.dismiss(toastId);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta unidad?")) return;
    const toastId = toast.loading('Eliminando...');
    try {
      await deleteUnit(id);
      toast.success("Unidad eliminada.");
      await refreshUnits(); // Refresca la lista
    } catch (e) {
      toast.error("No se pudo eliminar.");
    } finally {
        toast.dismiss(toastId);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>Gestión de Unidades</h1>
      
      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <input 
            className="grow" 
            placeholder="Buscar por código, torre o propietario..." 
            value={q} 
            onChange={e => setQ(e.target.value)} 
          />
          <button onClick={() => handleOpenEditModal()}>➕ Nueva Unidad</button>
        </div>

        <table className="table" width="100%">
          <thead>
            <tr>
              <th>Código</th><th>Torre</th><th>Número</th><th>Propietario</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="5">Cargando...</td></tr>
            ) : rows.length > 0 ? (
              rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <button 
                      onClick={() => handleViewDetails(r.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-700)', padding: 0, textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {r.code}
                    </button>
                  </td>
                  <td>{r.tower}</td>
                  <td>{r.number}</td>
                  <td>{r.owner_full_name || r.owner_username}</td>
                  <td>
                    <button onClick={() => handleOpenEditModal(r)}>Editar</button>
                    <button onClick={() => handleDelete(r.id)} style={{ marginLeft: 6, background: '#dc2626' }}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
                <tr><td colSpan="5">No se encontraron unidades.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <UnitModal 
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        unit={selectedUnit}
        onSave={handleSave}
        owners={owners}
      />
      <UnitDetailModal
        isOpen={isDetailModalOpen}
        onRequestClose={() => setIsDetailModalOpen(false)}
        unit={detailedUnitData}
      />
    </div>
  );
}