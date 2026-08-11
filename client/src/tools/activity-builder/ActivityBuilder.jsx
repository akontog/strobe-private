import React, { useEffect, useMemo, useState } from 'react';
import './ActivityBuilder.css';

const DEFAULT_CONFIG_TEXT = '{\n  "roundTimeSec": 60,\n  "targetError": 0.005\n}';

function toJsonString(value) {
  return JSON.stringify(value, null, 2);
}

export default function ActivityBuilder() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [activityName, setActivityName] = useState('');
  const [notes, setNotes] = useState('');
  const [configText, setConfigText] = useState(DEFAULT_CONFIG_TEXT);
  const [activities, setActivities] = useState([]);
  const [preview, setPreview] = useState('Select an activity to preview JSON.');
  const [status, setStatus] = useState('Loading apps...');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      try {
        const response = await fetch('/teacher/apps');
        if (!response.ok) {
          throw new Error(`Apps request failed with ${response.status}`);
        }

        const payload = await response.json();
        const nextApps = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setApps(nextApps);
          const firstSlug = nextApps[0]?.slug || '';
          setSelectedApp(firstSlug);
          setStatus(firstSlug ? 'Ready' : 'No teacher apps available.');
          setError('');
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load apps.');
          setStatus('Cannot load apps');
        }
      }
    }

    loadApps();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadActivities(slug) {
    if (!slug) {
      setActivities([]);
      return;
    }

    try {
      const response = await fetch(`/teacher/activities/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        throw new Error(`Activities request failed with ${response.status}`);
      }

      const payload = await response.json();
      setActivities(Array.isArray(payload) ? payload : []);
      setError('');
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load activities.');
    }
  }

  useEffect(() => {
    loadActivities(selectedApp);
  }, [selectedApp]);

  async function openActivity(filename) {
    if (!selectedApp || !filename) {
      return;
    }

    try {
      const response = await fetch(`/teacher/activities/${encodeURIComponent(selectedApp)}/${encodeURIComponent(filename)}`);
      if (!response.ok) {
        throw new Error(`Activity request failed with ${response.status}`);
      }

      const payload = await response.json();
      setPreview(toJsonString(payload));
      setActivityName(payload?.name || '');
      setNotes(payload?.notes || '');
      if (payload && payload.config) {
        setConfigText(toJsonString(payload.config));
      }
      setStatus(`Loaded ${filename}`);
      setError('');
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load activity.');
    }
  }

  async function saveActivity() {
    if (!selectedApp) {
      setError('Select an app first.');
      return;
    }

    let config;
    try {
      config = JSON.parse(configText || '{}');
    } catch (jsonError) {
      setError(`Invalid config JSON: ${jsonError.message}`);
      return;
    }

    setSaving(true);
    setStatus('Saving...');
    setError('');

    try {
      const response = await fetch(`/teacher/activities/${encodeURIComponent(selectedApp)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: activityName || 'Activity',
          config,
          notes,
          authorName: 'tools-spa'
        })
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      const payload = await response.json();
      setPreview(toJsonString(payload));
      setStatus('Saved successfully');
      await loadActivities(selectedApp);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to save activity.');
      setStatus('Save failed');
    } finally {
      setSaving(false);
    }
  }

  const selectedAppTitle = useMemo(() => {
    const found = apps.find((app) => app.slug === selectedApp);
    return found ? found.title : 'No app selected';
  }, [apps, selectedApp]);

  return (
    <section className="tool-page activity-builder-page">
      <header className="tool-page-header">
        <h1>Activity Builder</h1>
        <p>Create, save, and inspect teacher activities from the SPA.</p>
      </header>

      <div className="tool-grid tool-grid--two">
        <article className="tool-card">
          <h2>Editor</h2>
          <label>
            App
            <select value={selectedApp} onChange={(event) => setSelectedApp(event.target.value)}>
              {apps.map((app) => (
                <option key={app.slug} value={app.slug}>{app.title}</option>
              ))}
            </select>
          </label>

          <label>
            Activity name
            <input value={activityName} onChange={(event) => setActivityName(event.target.value)} placeholder="Lesson activity" />
          </label>

          <label>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Teacher notes" />
          </label>

          <label>
            Config JSON
            <textarea value={configText} onChange={(event) => setConfigText(event.target.value)} rows={12} />
          </label>

          <div className="tool-actions">
            <button type="button" onClick={saveActivity} disabled={saving}>{saving ? 'Saving...' : 'Save Activity'}</button>
          </div>

          <p className="tool-status">{status}</p>
          {error ? <p className="tool-error">{error}</p> : null}
        </article>

        <article className="tool-card">
          <h2>Library</h2>
          <p className="tool-subtitle">Current app: {selectedAppTitle}</p>

          <div className="activity-list">
            {activities.map((item) => (
              <button key={item.filename} type="button" className="activity-item" onClick={() => openActivity(item.filename)}>
                <strong>{item.name || item.filename}</strong>
                <span>{item.filename}</span>
              </button>
            ))}
            {!activities.length ? <p className="tool-muted">No saved activities for this app yet.</p> : null}
          </div>

          <h3>Preview</h3>
          <pre className="tool-preview">{preview}</pre>
        </article>
      </div>
    </section>
  );
}