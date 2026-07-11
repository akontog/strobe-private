import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../../../shared/components/Accordion';
export const DatasetSelector = ({
  datasets,
  currentDataset,
  currentExample,
  currentLinearDemoIndex,
  selectedInputs,
  features,
  onDatasetChange,
  onExampleChange,
  onLinearDemoChange,
  onSelectedInputsChange,
  isLinearDemoDisabled = false,
  demoIconWhenDisabled = '?'
}) => {
  const { t } = useTranslation(['common', 'neural']);
  // Παίρνουμε τα δεδομένα του τρέχοντος dataset
  const currentData = datasets[currentDataset];
  if (!currentData) {
    return <div>{t('neural.noData')}</div>;
  }

  // Ο πίνακας linear_demos (αν υπάρχει)
  const linearDemos = currentData.linear_demos || [];

  const activeInputSelection = {
    i1: selectedInputs?.i1 !== false,
    i2: Boolean(selectedInputs?.i2)
  };

  const resolveSelectionKey = () => {
    if (activeInputSelection.i1 && activeInputSelection.i2) return 'both';
    if (activeInputSelection.i1) return 'i1';
    if (activeInputSelection.i2) return 'i2';
    return 'both';
  };

  const resolveThresholdLabel = (threshold) => {
    if (!threshold || typeof threshold !== 'object') {
      return ` (${t('neural.notSeparable')})`;
    }

    if (!threshold.both && !threshold.i1 && !threshold.i2) {
      return ` (Όριο: ${threshold.op} ${threshold.boundary})`;
    }

    const key = resolveSelectionKey();

    const selectedThreshold = threshold[key] || threshold.both || threshold.i1 || threshold.i2;
    return selectedThreshold
      ? ` (${t('neural.separator')}: ${selectedThreshold.op} ${selectedThreshold.boundary})`
      : ` (${t('neural.notSeparable')})`;
  };

  const resolveSeparableStatus = (separable) => {
    if (typeof separable === 'boolean') {
      return separable ? '✅' : '❌';
    }

    if (!separable || typeof separable !== 'object') {
      return '❌';
    }

    const key = resolveSelectionKey();
    const selectedValue = separable[key];

    if (typeof selectedValue === 'boolean') {
      return selectedValue ? '✅' : '❌';
    }

    if (typeof separable.both === 'boolean') return separable.both ? '✅' : '❌';
    if (typeof separable.i1 === 'boolean') return separable.i1 ? '✅' : '❌';
    if (typeof separable.i2 === 'boolean') return separable.i2 ? '✅' : '❌';

    return '❌';
  };
  
  return (
    <Accordion title={`🗄️ ${t('neural.datasetsTitle')}`}>
    <div className="control-bar">
      <div className="select-group">
        <label>📊 {t('neural.chooseDataset')}</label>
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
        <label>🏷️ {t('neural.chooseExample')}</label>

        <select
          value={currentExample}
          onChange={(e) => onExampleChange(parseInt(e.target.value, 10))}
        >
          {datasets[currentDataset].examples.map((ex, idx) => (
            <option key={idx} value={idx}>
              {ex.icon} {ex.name}
            </option>
          ))}
        </select>
      </div>

      <div className="select-group">
        <label>🎛️ {t('neural.activeInputs')}</label>
        <div className="inputs-toggle-group">
          <label className="input-toggle-item">
            <input
              type="checkbox"
              checked={Boolean(activeInputSelection.i1)}
              onChange={(e) => {
                if (typeof onSelectedInputsChange === 'function') {
                  onSelectedInputsChange({
                    ...activeInputSelection,
                    i1: e.target.checked
                  });
                }
              }}
            />
            <span>{features?.i1?.icon} {features?.i1?.label || `${t('common.input')} 1`}</span>
          </label>
          <label className="input-toggle-item">
            <input
              type="checkbox"
              checked={Boolean(activeInputSelection.i2)}
              onChange={(e) => {
                if (typeof onSelectedInputsChange === 'function') {
                  onSelectedInputsChange({
                    ...activeInputSelection,
                    i2: e.target.checked
                  });
                }
              }}
            />
            <span>{features?.i2?.icon} {features?.i2?.label || `${t('common.input')} 2`}</span>
          </label>
        </div>
      </div>
      
      <div className="select-group">
          <label>📐 {t('neural.separation')} {isLinearDemoDisabled ? demoIconWhenDisabled : ''}</label>
          <select 
            value={currentLinearDemoIndex !== undefined ? currentLinearDemoIndex : ''} 
            onChange={(e) => onLinearDemoChange(e.target.value !== '' ? parseInt(e.target.value, 10) : undefined)}
            disabled={isLinearDemoDisabled}
          >
            <option value="">-- {t('common.cancel')} --</option>
            {linearDemos.map((demo, idx) => {
              const label = demo.example;
              const status = resolveSeparableStatus(demo.separable);
              const thresholdInfo = resolveThresholdLabel(demo.threshold);
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