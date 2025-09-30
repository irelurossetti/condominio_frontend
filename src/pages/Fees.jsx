// src/pages/Fees.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from 'react-modal';
import { api } from "../api";
import { fetchMe } from "../services/me";
import { listFees, listExpenseTypes, issueMonthlyFees, registerManualPayment } from "../services/fees";
import RegisterPaymentModal from '../components/RegisterPaymentModal';

const customModalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: 'min(400px, 90vw)', borderRadius: '16px', border: '1px solid #ddd', padding: '24px', textAlign: 'center'
  },
  overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const PaymentProgressBar = ({ total, paid }) => {
  const percentage = total > 0 ? (parseFloat(paid) / parseFloat(total)) * 100 : 0;
  return (
    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', height: '10px', marginTop: '4px' }}>
      <div style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage >= 100 ? 'var(--brand-500)' : '#f59e0b', height: '100%' }} />
    </div>
  );
};

export default function Fees() {
  const [me, setMe] = useState(null);
  const [fees, setFees] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const [isManualPayModalOpen, setIsManualPayModalOpen] = useState(false);
  const [feeToPayManually, setFeeToPayManually] = useState(null);

  const isAdmin = me?.profile?.role === 'ADMIN';

  // --- 👇 QR de ejemplo (Base64 de un QR vacío o simple) ---
  const MOCK_QR_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJ/gpLAAAAA1BMVEX///+np4HEw+d4AAABiklEQVR4nO3BMQEAAADCoPz3y0sfqgABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwjG2jAAGYl+7DAAAAAElFTkSuQmCC";

  async function loadData() {
    setLoading(true);
    try {
        const feesPromise = isAdmin ? listFees() : listFees({ mine: 1 });
        const promises = [feesPromise];
        if (isAdmin) {
            promises.push(listExpenseTypes());
        }
        
        const [feesData, expenseTypesData] = await Promise.all(promises);
        setFees(feesData.results || feesData);
        if (expenseTypesData) {
            setExpenseTypes(expenseTypesData.results || expenseTypesData);
        }
    } catch (error) {
        toast.error("Error al cargar los datos.");
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { fetchMe().then(setMe); }, []);
  useEffect(() => { if (me) loadData(); }, [me]);

  async function handleOnlinePay(fee) {
    setIsLoadingPayment(true);
    const toastId = toast.loading('Generando QR...');
    try {
      // --- 👇 CAMBIO AQUÍ: Usamos el QR de ejemplo ---
      setQrCodeData(MOCK_QR_BASE64); 
      setIsQrModalOpen(true);
      toast.success("QR generado con éxito (mock).", { id: toastId });
      // --- 👆 FIN DEL CAMBIO ---

      // Si quisieras volver a la lógica real de la API, descomentarías esto
      // const { data } = await api.post(`fees/${fee.id}/create-payment-preference/`);
      // const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64;
      // if (qrBase64) {
      //   setQrCodeData(qrBase64);
      //   setIsQrModalOpen(true);
      // } else {
      //   toast.error("No se pudo generar el código QR.");
      // }

    } catch (error) {
      toast.error("No se pudo iniciar el proceso de pago.");
    } finally {
      setIsLoadingPayment(false);
      // toast.dismiss(toastId); // Descomentar si usas la lógica real para cerrar el toast
    }
  }

  const handleOpenManualPay = (fee) => {
    setFeeToPayManually(fee);
    setIsManualPayModalOpen(true);
  };

  const handleSaveManualPayment = async (feeId, payload) => {
    const toastId = toast.loading('Registrando pago...');
    try {
        await registerManualPayment(feeId, payload);
        toast.success('Pago registrado correctamente.');
        setIsManualPayModalOpen(false);
        loadData();
    } catch (error) {
        const errorMsg = error.response?.data?.detail || 'No se pudo registrar el pago.';
        toast.error(errorMsg, { id: toastId });
    }
  };

  if (!me) return <div style={{padding: 24}}>Cargando...</div>;

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h1>Cuotas y Estado de Cuenta</h1>
      
      {isAdmin && <AdminPanel expenseTypes={expenseTypes} onIssue={loadData} />}

      <section className="card">
        <h3>{isAdmin ? 'Listado General de Cuotas' : 'Mi Estado de Cuenta'}</h3>
        <table className="table">
          <thead>
            <tr>
              {isAdmin && <th>Unidad</th>}
              <th>Tipo</th><th>Periodo</th>
              <th>Monto / Pagado</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5}>Cargando cuotas...</td></tr>
            ) : fees.length > 0 ? (
                fees.map((f) => (
                    <tr key={f.id}>
                        {isAdmin && <td>{f.unit_code}</td>}
                        <td>{f.expense_type_name}</td>
                        <td>{f.period}</td>
                        <td>
                            ${Number(f.amount).toFixed(2)} / ${Number(f.total_paid).toFixed(2)}
                            <PaymentProgressBar total={f.amount} paid={f.total_paid} />
                        </td>
                        <td><span className={`badge ${f.status === "PAID" ? "success" : "warn"}`}>{f.status}</span></td>
                        <td>
                          <div style={{display: 'flex', gap: '8px'}}>
                            {f.status !== 'PAID' && (
                                <button onClick={() => handleOnlinePay(f)} disabled={isLoadingPayment}>
                                Pagar Online
                                </button>
                            )}
                            {isAdmin && f.status !== 'PAID' && (
                                <button style={{background: 'var(--silver-700)'}} onClick={() => handleOpenManualPay(f)}>
                                    Registrar Pago
                                </button>
                            )}
                          </div>
                        </td>
                    </tr>
                ))
            ) : (
                <tr><td colSpan={isAdmin ? 6 : 5}>No hay cuotas para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal isOpen={isQrModalOpen} onRequestClose={() => setIsQrModalOpen(false)} style={customModalStyles}>
        <h2 style={{marginTop: 0}}>Escanea para Pagar</h2>
        <p>Usa la app de tu banco o billetera móvil.</p>
        {/* --- 👇 Aquí siempre se mostrará el QR (mock o real si lo activas) --- */}
        {qrCodeData ? (
          <img 
            src={`data:image/png;base64,${qrCodeData}`} 
            alt="Código QR de Pago"
            style={{
                width: '250px', height: '250px', margin: '16px auto',
                border: '6px solid var(--brand-500)',
                padding: '4px', borderRadius: '8px', display: 'block'
            }}
          />
        ) : <div style={{height: '250px', display: 'grid', placeContent: 'center'}}>Cargando QR...</div>}
        <button onClick={() => setIsQrModalOpen(false)} style={{marginTop: '1rem', width: '100%'}}>Cerrar</button>
      </Modal>

      {feeToPayManually && (
        <RegisterPaymentModal
            isOpen={isManualPayModalOpen}
            onRequestClose={() => setIsManualPayModalOpen(false)}
            fee={feeToPayManually}
            onSave={handleSaveManualPayment}
        />
      )}
    </div>
  );
}

function AdminPanel({ expenseTypes, onIssue }) {
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [expenseTypeId, setExpenseTypeId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!period || !expenseTypeId) {
            toast.error('Por favor, seleccione período y tipo de expensa.');
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Emitiendo cuotas...');
        try {
            const result = await issueMonthlyFees({ period, expense_type_id: expenseTypeId });
            toast.success(result.detail, { id: toastId });
            onIssue();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'No se pudieron emitir las cuotas.';
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="card">
            <h3>Panel de Administrador</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 200px' }}>Período (YYYY-MM)
                    <input type="month" value={period} onChange={e => setPeriod(e.target.value)} required />
                </label>
                <label style={{ flex: '1 1 200px' }}>Tipo de Expensa
                    <select value={expenseTypeId} onChange={e => setExpenseTypeId(e.target.value)} required>
                        <option value="">-- Seleccionar --</option>
                        {expenseTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                    </select>
                </label>
                <button type="submit" disabled={isLoading}>{isLoading ? 'Emitiendo...' : 'Emitir Cuotas'}</button>
            </form>
        </section>
    );
}