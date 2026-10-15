import React from 'react';
import { useTranslation } from 'react-i18next';
import ResourceSettings from './ResourceSettings';

export default function EditorPanel({
  resources,
  selectedResource,
  resourceSettings,
  onSelectedResourceChange,
  onResourceSettingsChange,
  activityName,
  onActivityNameChange,
  notes,
  onNotesChange,
  onSave,
  saving,
  status,
  error
}) {
  const { t } = useTranslation('interface');

  return (
    <article className="tool-card">
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

      {selectedResource ? (
        <ResourceSettings
          resource={selectedResource}
          value={resourceSettings}
          onChange={onResourceSettingsChange}
          t={t}
        />
      ) : null}

      <label>
        {t('activityBuilder.activityName')}
        <input value={activityName} onChange={(event) => onActivityNameChange(event.target.value)} placeholder={t('activityBuilder.activityNamePlaceholder')} />
      </label>

      <label>
        {t('activityBuilder.notes')}
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={4} placeholder={t('activityBuilder.notesPlaceholder')} />
      </label>

      <div className="tool-actions">
        <button type="button" onClick={onSave} disabled={saving || !selectedResource}>
          {saving ? t('activityBuilder.saving') : t('activityBuilder.saveActivity')}
        </button>
      </div>

      <p className="tool-status">{status}</p>
      {error ? <p className="tool-error">{error}</p> : null}
    </article>
  );
}
