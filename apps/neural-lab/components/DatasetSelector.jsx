import React from 'react';
import { Accordion } from '../../shared/components/Accordion';
export const DatasetSelector = ({
  datasets,
  currentDataset,
  currentExample,
  currentLinearDemoIndex,
  onDatasetChange,
  onExampleChange,
  onLinearDemoChange
}) => {
  // Παίρνουμε τα δεδομένα του τρέχοντος dataset
  const currentData = datasets[currentDataset];
  if (!currentData) {
    return <div>Δεν υπάρχουν δεδομένα για το επιλεγμένο dataset</div>;
  }

  // Ο πίνακας linear_demos (αν υπάρχει)
  const linearDemos = currentData.linear_demos || [];
  
  return (
    <Accordion title="🗄️ Δεδομένα">
    <div className="control-bar">
      <div className="select-group">
        <label>📊 Σύνολο δεδομένων</label>
        <select
          value={currentDataset}
          onChange={(e) => onDatasetChange(e.target.value)}
        >
          {Object.entries(datasets).map(([key, val]) => (
            <option key={key} value={key}>
              {val.emoji} {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="select-group">
        <label>🏷️ Παράδειγμα</label>

        <select
          value={currentExample}
          onChange={(e) => onExampleChange(parseInt(e.target.value, 10))}
        >
          {datasets[currentDataset].examples.map((ex, idx) => (
            <option key={idx} value={idx}>
              {ex.icon} {ex.name}
              {' '}
              (
              {datasets[currentDataset].features.i1.icon}
              {' '}
              {datasets[currentDataset].features.i1.label}={ex.i1},
              {' '}
              {datasets[currentDataset].features.i2.icon}
              {' '}
              {datasets[currentDataset].features.i2.label}={ex.i2}
              )
            </option>
          ))}
        </select>
      </div>
      
      <div className="select-group">
          <label>📐 Διαχωρισμός</label>
          <select 
            value={currentLinearDemoIndex !== undefined ? currentLinearDemoIndex : ''} 
            onChange={(e) => onLinearDemoChange(e.target.value !== '' ? parseInt(e.target.value, 10) : undefined)}
          >
            <option value="">-- Επιλέξτε --</option>
            {linearDemos.map((demo, idx) => {
              const label = demo.example;
              const status = demo.separable ? '✅' : '❌';
              const thresholdInfo = demo.threshold ? ` (Όριο: ${demo.threshold})` : ' (Μη διαχωρίσιμο)';
              return (
                <option key={idx} value={idx}>
                  {idx+1}. {label} {status}{thresholdInfo}
                </option>
              );
            })}
          </select>
        </div>
    </div>
  </Accordion>
  );
};