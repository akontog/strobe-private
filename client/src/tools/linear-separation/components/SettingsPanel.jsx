import React from 'react';

export default function DatasetSettingsPanel({
  datasetKeys,
  datasetKey,
  onDatasetChange,
  examples,
  effectiveTarget,
  onTargetChange
}) {
  return (
    <article className="tool-card">
      <h2>Ρυθμίσεις</h2>
      <div className="tool-grid tool-grid--two">
        <label>
          Dataset
          <select value={datasetKey} onChange={(event) => onDatasetChange(event.target.value)}>
            {datasetKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </label>
        <label>
          Κατηγορία-στόχος
          <select value={effectiveTarget} onChange={(event) => onTargetChange(event.target.value)}>
            {examples.map((example) => (
              <option key={example.name} value={example.name}>{example.name}</option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}