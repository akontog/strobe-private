import React from 'react';
import { GeogebraMonitor } from '../../shared/components';
import './GeogebraMonitorTool.css';

export default function GeogebraMonitorTool() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-shell geo-monitor-tool">
        <header className="geo-monitor-tool__header">
          <h1>GeoGebra Central Monitor</h1>
          <p>
            Παρακολουθεί όλα τα connected collaborative GeoGebra rooms και εμφανίζει ζωντανά τη δημιουργία,
            μεταφορά, μετονομασία και διαγραφή των αντικειμένων.
          </p>
        </header>

        <GeogebraMonitor />
      </div>
    </section>
  );
}
