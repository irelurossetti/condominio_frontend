// src/components/UnitDetailModal.jsx
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(800px, 90vw)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '20px' }}>
    <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>{title}</h3>
    {children}
  </section>
);

export default function UnitDetailModal({ isOpen, onRequestClose, unit }) {
  if (!unit) return null;

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
      <div style={{ flex: '0 0 auto' }}>
        <h2>Detalles de la Unidad: {unit.code}</h2>
      </div>
      
      <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '10px 0' }}>
        <Section title="Información del Propietario">
          <p><strong>Nombre:</strong> {unit.owner?.profile?.full_name || 'N/A'}</p>
          <p><strong>Usuario:</strong> @{unit.owner?.username}</p>
          <p><strong>Email:</strong> {unit.owner?.email}</p>
          <p><strong>Teléfono:</strong> {unit.owner?.profile?.phone || 'N/A'}</p>
        </Section>

        <Section title="Historial de Cuotas Recientes">
          {unit.fees?.length > 0 ? (
            <table className="table">
              <thead><tr><th>Período</th><th>Tipo</th><th>Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {unit.fees.slice(0, 5).map(fee => (
                  <tr key={fee.id}>
                    <td>{fee.period}</td>
                    <td>{fee.expense_type_name}</td>
                    <td>${Number(fee.amount).toFixed(2)}</td>
                    <td><span className={`badge ${fee.status === 'PAID' ? 'success' : 'warn'}`}>{fee.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No hay cuotas registradas para esta unidad.</p>}
        </Section>
        
        <Section title="Reportes de Mantenimiento">
            {unit.maintenance_requests?.length > 0 ? (
                 unit.maintenance_requests.map(req => (
                    <div key={req.id} style={{border: '1px solid #eee', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px'}}>
                        <strong>{req.title}</strong> ({req.status}) - {new Date(req.created_at).toLocaleDateString()}
                    </div>
                 ))
            ) : <p>No hay reportes de mantenimiento para esta unidad.</p>}
        </Section>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <button type="button" onClick={onRequestClose}>Cerrar</button>
      </div>
    </Modal>
  );
}