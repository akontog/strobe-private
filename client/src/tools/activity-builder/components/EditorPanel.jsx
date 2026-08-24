import React from 'react';

export default function EditorPanel({
  apps,
  selectedApp,
  onSelectedAppChange,
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
  return (
    <article className="tool-card">
      <label>
        App
        <select value={selectedApp} onChange={(event) => onSelectedAppChange(event.target.value)}>
          {apps.map((app) => (
            <option key={app.slug} value={app.slug}>{app.title}</option>
          ))}
        </select>
      </label>

      <label>
        Activity name
        <input value={activityName} onChange={(event) => onActivityNameChange(event.target.value)} placeholder="Lesson activity" />
      </label>

      <label>
        Notes
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={4} placeholder="Teacher notes" />
      </label>

      <label>
        Config JSON
        <textarea value={configText} onChange={(event) => onConfigTextChange(event.target.value)} rows={12} />
      </label>

      <div className="tool-actions">
        <button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Activity'}</button>
      </div>

      <p className="tool-status">{status}</p>
      {error ? <p className="tool-error">{error}</p> : null}
    </article>
  );
}