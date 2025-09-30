// src/components/FeesChart.jsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FeesChart({ reportData }) {
  if (!reportData || !reportData.by_period || reportData.by_period.length === 0) {
    return <p>No hay suficientes datos para mostrar el gráfico.</p>;
  }

  const options = {
    // 👇 --- LÍNEAS MODIFICADAS --- 👇
    responsive: true,
    maintainAspectRatio: false, // <-- Muy importante para que respete la altura del div contenedor
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Emitido vs. Pagado por Período' },
    },
    scales: { y: { beginAtZero: true } }
  };

  const labels = reportData.by_period.map(p => p.period);

  const data = {
    labels,
    datasets: [
      {
        label: 'Emitido',
        data: reportData.by_period.map(p => p.issued),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pagado',
        data: reportData.by_period.map(p => p.paid),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  return <Bar options={options} data={data} />;
}