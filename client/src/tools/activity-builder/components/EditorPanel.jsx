import React from 'react';
import { useTranslation } from 'react-i18next';

export default function EditorPanel({
  apps,
  selectedResource,
  onSelectedResourceChange,
  activityOptions,
  selectedActivity,
  onSelectedActivityChange,
  activityName,
  onActivityNameChange,
  notes,
  onNotesChange,
  configText,
  onConfigTextChange,
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
          {apps.map((app) => (
            <option key={app.slug} value={app.slug}>
              {t(`activityBuilder.resourceNames.${app.slug}`, { defaultValue: app.title })}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t('activityBuilder.activity')}
        <select value={selectedActivity} onChange={(event) => onSelectedActivityChange(event.target.value)} disabled={!selectedResource}>
          <option value="">{t('activityBuilder.chooseActivity')}</option>
          {activityOptions.map((activity) => (
            <option key={activity.value} value={activity.value}>{activity.label}</option>
          ))}
        </select>
      </label>

      <label>
        {t('activityBuilder.activityName')}
        <input value={activityName} onChange={(event) => onActivityNameChange(event.target.value)} placeholder={t('activityBuilder.activityNamePlaceholder')} />
      </label>

      <label>
        {t('activityBuilder.notes')}
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={4} placeholder={t('activityBuilder.notesPlaceholder')} />
      </label>

      <label>
        {t('activityBuilder.configJson')}
        <textarea value={configText} onChange={(event) => onConfigTextChange(event.target.value)} rows={12} />
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
