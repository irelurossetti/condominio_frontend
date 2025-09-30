// src/services/fees.js
import { api } from "../api";

export const listExpenseTypes = () =>
  api.get("expense-types/").then(r => r.data);

// Modificado para aceptar filtros
export const listFees = (params) =>
  api.get("fees/", { params }).then(r => r.data);

// Se mantiene para la vista de residente si se necesita
export const listMyFees = () =>
  api.get("fees/?mine=1").then(r => r.data);

// --- 👇 ESTAS SON LAS FUNCIONES QUE FALTABAN ---

// Para emitir cuotas en bloque (Admin)
export const issueMonthlyFees = (payload) =>
  api.post("fees/issue_monthly_fees/", payload).then(r => r.data);

// Para registrar un pago manual (Admin)
export const registerManualPayment = (feeId, payload) =>
  api.post(`fees/${feeId}/pay/`, payload).then(r => r.data);

// NOTA: Tu función 'payFee' anterior fue renombrada a 'registerManualPayment' para mayor claridad.
// Si algún otro archivo la usaba, deberás actualizar el nombre allí también.