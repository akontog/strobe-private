import React from 'react';

export default function LibraryPanel({ selectedAppTitle, activities, onOpenActivity, preview }) {
  return (
    <article className="tool-card">
      <p className="tool-subtitle">Current app: {selectedAppTitle}</p>

      <div className="activity-list">
        {activities.map((item) => (
          <button key={item.filename} type="button" className="activity-item" onClick={() => onOpenActivity(item.filename)}>
            <strong>{item.name || item.filename}</strong>
            <span>{item.filename}</span>
          </button>
        ))}
        {!activities.length ? <p className="tool-muted">No saved activities for this app yet.</p> : null}
      </div>

      <h3>Preview</h3>
      <pre className="tool-preview">{preview}</pre>
    </article>
  );
}