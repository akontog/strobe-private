import React from 'react';
import { useTranslation } from 'react-i18next';

export default function InputPanel(
    { jsonText, onJsonTextChange, onFileUpload, onApply, parseError }
    ) {
  const { t } = useTranslation('interface');
  return (
    <article className="tool-card">
      <h2>{t('linearSeparationInputTitle')}</h2>
      <textarea
        value={jsonText}
        onChange={(event) => onJsonTextChange(event.target.value)}
        placeholder={t('linearSeparationJsonPlaceholder')}
        rows={14}
      />
      <div className="tool-actions">
        <input type="file" accept="application/json,.json" onChange={onFileUpload} />
        <button type="button" onClick={onApply}>{t('linearSeparationLoadJson')}</button>
      </div>
      {parseError ? <p className="tool-error">{t('linearSeparationJsonError')}: {parseError}</p> : null}
    </article>
  );
}
