import React from 'react';
import { Accordion } from '../../shared/components/Accordion';
export const DatasetSelector = ({
  datasets,
  currentDataset,
  currentExample,
  onDatasetChange,
  onExampleChange
}) => 
  (
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
    </div>
  </Accordion>
  );