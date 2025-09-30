// src/components/RegisterPaymentModal.jsx
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-hot-toast';

const customStyles = {
    content: {
      top: '50%', left: '50%', right: 'auto', bottom: 'auto',
      marginRight: '-50%', transform: 'translate(-50%, -50%)',
      width: 'min(400px, 90vw)', borderRadius: '16px', border: '1px solid #ddd', padding: '24px'
    },
    overlay: { zIndex: 1000 }
};

Modal.setAppElement('#root');

export default function RegisterPaymentModal({ isOpen, onRequestClose, fee, onSave }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');

    // Sincroniza el estado del formulario cuando la prop 'fee' cambia
    useEffect(() => {
        if (fee) {
            setAmount(String(fee.amount - fee.total_paid));
        }
    }, [fee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fee || parseFloat(amount) <= 0) {
            toast.error('El monto debe ser mayor a cero.');
            return;
        }
        onSave(fee.id, { amount, method, note });
    };

    if (!fee) return null;

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <h2>Registrar Pago para Cuota #{fee.id}</h2>
            <p>Unidad: <strong>{fee.unit_code}</strong> | Período: <strong>{fee.period}</strong></p>
            <form onSubmit={handleSubmit} id="payment-form" style={{ display: 'grid', gap: '1rem' }}>
                <label>Monto a Pagar
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </label>
                <label>Método de Pago
                    <select value={method} onChange={e => setMethod(e.target.value)}>
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="other">Otro</option>
                    </select>
                </label>
                <label>Nota (Opcional)
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Pago realizado por el residente..." />
                </label>
            </form>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={onRequestClose} style={{ background: 'var(--silver-500)' }}>Cancelar</button>
                <button type="submit" form="payment-form">Confirmar Pago</button>
            </div>
        </Modal>
    );
}