// condominio_frontend/src/components/ReportSkeleton.jsx
export default function ReportSkeleton() {
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card skeleton" style={{ height: '90px' }}></div>
        <div className="kpi-card skeleton" style={{ height: '90px' }}></div>
        <div className="kpi-card skeleton" style={{ height: '90px' }}></div>
      </div>
      <div className="card skeleton" style={{ height: '300px', marginTop: '24px' }}></div>
      <div className="card skeleton" style={{ height: '200px', marginTop: '24px' }}></div>
    </>
  );
}