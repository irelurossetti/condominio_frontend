// src/services/units.js
import { api } from "../api";

export async function listUnits(params = {}) {
  const { data } = await api.get("units/", { params });
  return data;
}

// --- 👇 AÑADE ESTA NUEVA FUNCIÓN ---
export async function getUnitDetails(id) {
  const { data } = await api.get(`units/${id}/`);
  return data;
}

export async function createUnit(payload) {
  const { data } = await api.post("units/", payload);
  return data;
}
export async function updateUnit(id, payload) {
  const { data } = await api.patch(`units/${id}/`, payload);
  return data;
}
export async function deleteUnit(id) {
  await api.delete(`units/${id}/`);
}