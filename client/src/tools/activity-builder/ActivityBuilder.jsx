import React, { useEffect, useMemo, useState } from 'react';
import './ActivityBuilder.css';
import { EditorPanel, LibraryPanel } from './components';
import { Accordion } from '../../shared/components';
import { fetchApps, fetchActivities, fetchActivity, saveActivityRequest } from './logic/activityApi';
import { toJsonString } from './logic/jsonUtils';
import { DEFAULT_CONFIG_TEXT } from './data/defaultConfig';

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

    fetchApps()
      .then((nextApps) => {
        if (cancelled) return;
        setApps(nextApps);
        const firstSlug = nextApps[0]?.slug || '';
        setSelectedApp(firstSlug);
        setStatus(firstSlug ? 'Ready' : 'No teacher apps available.');
        setError('');
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load apps.');
        setStatus('Cannot load apps');
      });

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
      const nextActivities = await fetchActivities(slug);
      setActivities(nextActivities);
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
      const payload = await fetchActivity(selectedApp, filename);
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
      const payload = await saveActivityRequest(selectedApp, { name: activityName, config, notes });
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
      </header>

      <div className="tool-grid tool-grid--two">
        <Accordion
          title="Activity Editor"
          icon= "📝"
          open={true}
        >
          <EditorPanel
            apps={apps}
            selectedApp={selectedApp}
            onSelectedAppChange={setSelectedApp}
            activityName={activityName}
            onActivityNameChange={setActivityName}
            notes={notes}
            onNotesChange={setNotes}
            configText={configText}
            onConfigTextChange={setConfigText}
            onSave={saveActivity}
            saving={saving}
            status={status}
            error={error}
          />
        </Accordion>
        <Accordion
          title="Activity Library"
          icon= "📚"
          open={false}
        >
          <LibraryPanel
            selectedAppTitle={selectedAppTitle}
            activities={activities}
            onOpenActivity={openActivity}
            preview={preview}
          />
          </Accordion>
      </div>
    </section>
  );
}