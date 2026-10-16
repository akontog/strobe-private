import React from 'react';
import { useTranslation } from 'react-i18next';
import ResourceSettings from './ResourceSettings';

export default function EditorPanel({
  resources, selectedResource, resourceSettings, onSelectedResourceChange,
  onResourceSettingsChange, title, onTitleChange, notes, onNotesChange,
  onOpenFile, onFileChange, fileInputRef, onSave, saving, status, error, preview
}) {
  const { t } = useTranslation('interface');

  return (
    <article className="tool-card activity-settings-card">
      <div className="activity-settings-heading">
        <h2>{t('activityBuilder.settingsTitle')}</h2>
        <button type="button" className="activity-open-file" onClick={onOpenFile}>{t('activityBuilder.openFile')}</button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileChange} hidden />
      </div>

      <label>
        {t('activityBuilder.titleLabel')}
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder={t('activityBuilder.titlePlaceholder')} />
      </label>

      <label>
        {t('activityBuilder.notes')}
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={4} placeholder={t('activityBuilder.notesPlaceholder')} />
      </label>

      <label>
        {t('activityBuilder.resource')}
        <select value={selectedResource} onChange={(event) => onSelectedResourceChange(event.target.value)}>
          <option value="">{t('activityBuilder.chooseResource')}</option>
          {resources.map((resource) => (
            <option key={resource.slug} value={resource.slug}>
              {t(`activityBuilder.resourceNames.${resource.slug}`, { defaultValue: resource.title })}
            </option>
          ))}
        </select>
      </label>

      {selectedResource ? <ResourceSettings resource={selectedResource} value={resourceSettings} onChange={onResourceSettingsChange} t={t} /> : null}

      <div className="tool-actions">
        <button type="button" onClick={onSave} disabled={saving || !selectedResource}>
          {saving ? t('activityBuilder.saving') : t('activityBuilder.saveActivity')}
        </button>
      </div>
      <p className="tool-status">{status}</p>
      {error ? <p className="tool-error">{error}</p> : null}
      <details className="activity-json-preview">
        <summary>{t('activityBuilder.jsonPreview')}</summary>
        <pre className="tool-preview">{preview}</pre>
      </details>
    </article>
  );
}
