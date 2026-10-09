import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LibraryPanel({ selectedAppTitle, activities, onOpenActivity, preview }) {
  const { t } = useTranslation('interface');
  return (
    <article className="tool-card">
      <p className="tool-subtitle">{t('currentApp', { title: selectedAppTitle })}</p>

      <div className="activity-list">
        {activities.map((item) => (
          <button key={item.filename} type="button" className="activity-item" onClick={() => onOpenActivity(item.filename)}>
            <strong>{item.name || item.filename}</strong>
            <span>{item.filename}</span>
          </button>
        ))}
        {!activities.length ? <p className="tool-muted">{t('noSavedActivities')}</p> : null}
      </div>

      <h3>{t('preview')}</h3>
      <pre className="tool-preview">{preview}</pre>
    </article>
  );
}
