// src/components/UnitModal.jsx
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(500px, 90vw)',
    padding: '2rem'
  },
  overlay: { zIndex: 1000 }
};

Modal.setAppElement('#root');

export default function UnitModal({ isOpen, onRequestClose, unit, onSave, owners }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    // Si pasamos una unidad, estamos editando. Si no, creando.
    if (unit) {
      setForm({ ...unit });
    } else {
      setForm({ code: "", tower: "", number: "", owner: "" });
    }
  }, [unit, isOpen]); // Se actualiza cada vez que el modal se abre o la unidad cambia

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
      <h2>{unit ? 'Editar Unidad' : 'Crear Nueva Unidad'}</h2>
      <form id="unit-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        <input name="code" value={form.code || ''} onChange={handleChange} placeholder="Código (ej. T1-302)" required />
        <input name="tower" value={form.tower || ''} onChange={handleChange} placeholder="Torre" required />
        <input name="number" value={form.number || ''} onChange={handleChange} placeholder="Número" required />
        <select name="owner" value={form.owner || ''} onChange={handleChange} required>
          <option value="">-- Seleccione un Propietario --</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </form>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" onClick={onRequestClose} style={{ background: 'var(--silver-500)' }}>Cancelar</button>
        <button type="submit" form="unit-form">Guardar Cambios</button>
      </div>
    </Modal>
  );
}