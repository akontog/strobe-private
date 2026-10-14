import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ActivityBuilder.css';
import { EditorPanel, LibraryPanel } from './components';
import { Accordion } from '../../shared/components';
import { fetchApps, fetchActivities, fetchActivity, saveActivityRequest } from './logic/activityApi';
import { toJsonString } from './logic/jsonUtils';
import { DEFAULT_CONFIG_TEXT } from './data/defaultConfig';

function getResourceActivities(t, resource) {
  const options = t(`activityBuilder.resources.${resource}`, { returnObjects: true });
  return Array.isArray(options) ? options : [];
}

export default function ActivityBuilder() {
  const { t } = useTranslation('interface');
  const [apps, setApps] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [activityName, setActivityName] = useState('');
  const [notes, setNotes] = useState('');
  const [configText, setConfigText] = useState(DEFAULT_CONFIG_TEXT);
  const [activities, setActivities] = useState([]);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const libraryRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    fetchApps()
      .then((nextApps) => {
        if (cancelled) return;
        setApps(nextApps);
        const firstResource = nextApps[0]?.slug || '';
        setSelectedResource(firstResource);
        setSelectedActivity(getResourceActivities(t, firstResource)[0]?.value || '');
        setStatus({ key: firstResource ? 'activityBuilder.ready' : 'activityBuilder.noResources' });
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setError(t('activityBuilder.loadResourcesError'));
        setStatus({ key: 'activityBuilder.loadError' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadActivities(resource) {
    const requestId = libraryRequestId.current + 1;
    libraryRequestId.current = requestId;
    if (!resource) {
      setActivities([]);
      return;
    }

    try {
      const nextActivities = await fetchActivities(resource);
      if (requestId !== libraryRequestId.current) return;
      setActivities(nextActivities);
      setError('');
    } catch {
      if (requestId !== libraryRequestId.current) return;
      setError(t('activityBuilder.loadLibraryError'));
    }
  }

  useEffect(() => {
    loadActivities(selectedResource);
  }, [selectedResource]);

  async function openActivity(filename) {
    if (!selectedResource || !filename) return;

    try {
      const payload = await fetchActivity(selectedResource, filename);
      setPreview(toJsonString(payload));
      setActivityName(payload?.name || '');
      setNotes(payload?.notes || '');
      setSelectedActivity(String(payload?.config?.activityId || ''));
      if (payload?.config) setConfigText(toJsonString(payload.config));
      setStatus({ key: 'activityBuilder.loaded', values: { filename } });
      setError('');
    } catch {
      setError(t('activityBuilder.loadActivityError'));
    }
  }

  async function saveActivity() {
    if (!selectedResource) {
      setError(t('activityBuilder.selectResource'));
      return;
    }

    let config;
    try {
      config = JSON.parse(configText || '{}');
    } catch (jsonError) {
      setError(t('activityBuilder.invalidConfig', { message: jsonError.message }));
      return;
    }

    setSaving(true);
    setStatus({ key: 'activityBuilder.saving' });
    setError('');

    try {
      const payload = await saveActivityRequest(selectedResource, {
        name: activityName,
        config: { ...config, activityId: selectedActivity },
        notes
      });
      setPreview(toJsonString(payload));
      setStatus({ key: 'activityBuilder.saved' });
      await loadActivities(selectedResource);
    } catch {
      setError(t('activityBuilder.saveError'));
      setStatus({ key: 'activityBuilder.saveFailed' });
    } finally {
      setSaving(false);
    }
  }

  const selectedResourceTitle = t(`activityBuilder.resourceNames.${selectedResource}`, {
    defaultValue: apps.find((app) => app.slug === selectedResource)?.title || ''
  });
  const activityOptions = getResourceActivities(t, selectedResource);

  return (
    <section className="tool-page activity-builder-page">
      <header className="tool-page-header">
        <h1>{t('activityBuilder.title')}</h1>
      </header>

      <div className="tool-grid tool-grid--two">
        <Accordion title={t('activityBuilder.editorTitle')} icon="📝">
          <EditorPanel
            apps={apps}
            selectedResource={selectedResource}
            onSelectedResourceChange={(resource) => {
              setSelectedResource(resource);
              setSelectedActivity(getResourceActivities(t, resource)[0]?.value || '');
            }}
            activityOptions={activityOptions}
            selectedActivity={selectedActivity}
            onSelectedActivityChange={setSelectedActivity}
            activityName={activityName}
            onActivityNameChange={setActivityName}
            notes={notes}
            onNotesChange={setNotes}
            configText={configText}
            onConfigTextChange={setConfigText}
            onSave={saveActivity}
            saving={saving}
            status={status.key ? t(status.key, status.values) : ''}
            error={error}
          />
        </Accordion>
        <Accordion title={t('activityBuilder.libraryTitle')} icon="📚" open={false}>
          <LibraryPanel
            selectedResourceTitle={selectedResourceTitle}
            activities={activities}
            onOpenActivity={openActivity}
            preview={preview}
          />
        </Accordion>
      </div>
    </section>
  );
}
