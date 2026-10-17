import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DatasetSettingsPanel({
  datasetKeys,
  datasetKey,
  onDatasetChange,
  examples,
  effectiveTarget,
  onTargetChange
}) {
  const { t } = useTranslation('interface');
  return (
    <article className="tool-card">
      <div className="tool-grid tool-grid--two">
        <label>
          {t('linearSeparationDataset')}
          <select value={datasetKey} onChange={(event) => onDatasetChange(event.target.value)}>
            {datasetKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </label>
        <label>
          {t('linearSeparationTargetCategory')}
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
