import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ActivityBuilder.css';
import { EditorPanel, LibraryPanel } from './components';
import { Accordion } from '../../shared/components';
import { fetchResources, fetchActivities, fetchActivity, saveActivityRequest } from './logic/activityApi';
import { toJsonString } from './logic/jsonUtils';
import { RESOURCE_DEFAULTS } from './data/resourceDefaults';

function cloneResourceDefaults(resource, t) {
  const defaults = JSON.parse(JSON.stringify(RESOURCE_DEFAULTS[resource] || {}));
  if (resource === 'input-grid') {
    defaults.props.fields.forEach((field, index) => {
      field.label = t('activityBuilder.defaultInput', { index: index + 1 });
    });
  }
  if (resource === 'grouping-drag-drop') {
    defaults.props.groups.forEach((group, index) => {
      group.title = t('activityBuilder.defaultGroup', { index: index + 1 });
    });
    defaults.props.items.forEach((item, index) => {
      item.content = t('activityBuilder.defaultItem', { index: index + 1 });
    });
    defaults.props.bankLabel = t('activityBuilder.defaultItemsBank');
  }
  return defaults;
}

function buildActivityConfig(resource, settings, activityName) {
  const config = {
    resource,
    props: { ...(settings.props || {}) },
    labCard: { ...(settings.labCard || {}) }
  };

  if (resource === 'input-grid') {
    config.props.activity = activityName;
    config.grading = {
      answers: Object.fromEntries((settings.props?.fields || []).map((field) => [field.id, field.correctAnswer ?? '']))
    };
  } else if (resource === 'grouping-drag-drop') {
    config.props.activity = activityName;
    config.grading = settings.grading || {};
  } else if (settings.grading) {
    config.grading = settings.grading;
  }

  return config;
}

export default function ActivityBuilder() {
  const { t } = useTranslation('interface');
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [resourceSettings, setResourceSettings] = useState({});
  const [activityName, setActivityName] = useState('');
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState([]);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const libraryRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    fetchResources()
      .then((nextResources) => {
        if (cancelled) return;
        setResources(nextResources);
        const firstResource = nextResources[0]?.slug || '';
        setSelectedResource(firstResource);
        setResourceSettings(cloneResourceDefaults(firstResource, t));
        setStatus({ key: firstResource ? 'activityBuilder.ready' : 'activityBuilder.noResources' });
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
      const config = payload?.config || {};
      setPreview(toJsonString(payload));
      setActivityName(payload?.name || '');
      setNotes(payload?.notes || '');
      setResourceSettings({ ...cloneResourceDefaults(selectedResource, t), ...config, props: config.props || {} });
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
    if (!activityName.trim()) {
      setError(t('activityBuilder.activityNameRequired'));
      return;
    }

    setSaving(true);
    setStatus({ key: 'activityBuilder.saving' });
    setError('');

    try {
      const config = buildActivityConfig(selectedResource, resourceSettings, activityName);
      const payload = await saveActivityRequest(selectedResource, {
        name: activityName,
        config,
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

  const selectedResourceTitle = resources.find((resource) => resource.slug === selectedResource)?.title || '';

  return (
    <section className="tool-page activity-builder-page">
      <header className="tool-page-header">
        <h1>{t('activityBuilder.title')}</h1>
      </header>

      <div className="tool-grid tool-grid--two">
        <Accordion title={t('activityBuilder.editorTitle')} icon="📝">
          <EditorPanel
            resources={resources}
            selectedResource={selectedResource}
            resourceSettings={resourceSettings}
            onSelectedResourceChange={(resource) => {
              setSelectedResource(resource);
              setResourceSettings(cloneResourceDefaults(resource, t));
              setError('');
            }}
            onResourceSettingsChange={setResourceSettings}
            activityName={activityName}
            onActivityNameChange={(value) => {
              setActivityName(value);
              if (value.trim()) setError('');
            }}
            notes={notes}
            onNotesChange={setNotes}
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
