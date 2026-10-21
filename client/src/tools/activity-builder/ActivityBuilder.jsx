import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ActivityBuilder.css';
import { EditorPanel } from './components';
import { HeroTitle } from '../../shared/components';
import { fetchResources, fetchAllActivities, fetchActivity, saveActivityRequest } from './logic/activityApi';
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
  if (resource === 'options-grid') {
    defaults.props.items.forEach((item, index) => {
      item.label = t('activityBuilder.defaultOption', { index: index + 1 });
    });
  }
  return defaults;
}

function buildActivityConfig(resource, settings, title) {
  const props = { ...(settings.props || {}) };
  delete props.className;
  delete props.labelClassName;
  delete props.customLayout;
  if (Array.isArray(props.fields)) {
    props.fields = props.fields.map((field) => {
      const cleanField = { ...field };
      delete cleanField.className;
      delete cleanField.inputClassName;
      delete cleanField.displayClassName;
      return cleanField;
    });
  }
  const config = {
    resource,
    props,
    widgets: (settings.widgets || []).slice(0, 2).map((widget) => ({ ...widget, settings: { ...(widget.settings || {}) } }))
  };

  if (resource === 'input-grid') {
    config.props.activity = title;
    config.grading = {
      answers: Object.fromEntries((settings.props?.fields || []).map((field) => [field.id, field.correctAnswer ?? '']))
    };
  } else if (resource === 'grouping-drag-drop') {
    config.props.activity = title;
    config.grading = settings.grading || {};
  } else if (settings.grading) {
    config.grading = settings.grading;
  }

  return config;
}

function normalizeWidget(widget, index) {
  if (widget.type === 'simple-coordinate-system') {
    return { ...widget, type: 'plot-widget', id: widget.id || `widget-${index + 1}`, position: widget.position || 'left' };
  }
  if (widget.type !== 'lab-card') {
    return { ...widget, id: widget.id || `widget-${index + 1}`, position: widget.position || 'left' };
  }
  const settings = widget.settings || {};
  if (settings.display === 'expression') {
    return { ...widget, type: 'equation', settings: { expression: settings.expression || '' } };
  }
  const icon = String(settings.icon || '');
  const firstCodePoint = Array.from(icon)[0]?.codePointAt(0);
  return {
    ...widget,
    id: widget.id || `widget-${index + 1}`,
    type: 'icon',
    settings: { code: firstCodePoint ? `U+${firstCodePoint.toString(16).toUpperCase()}` : '' }
  };
}

export default function ActivityBuilder() {
  const { t } = useTranslation('interface');
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [resourceSettings, setResourceSettings] = useState({});
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [selectedServerActivity, setSelectedServerActivity] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchResources(), fetchAllActivities().catch(() => [])])
      .then(([nextResources, nextActivities]) => {
        if (cancelled) return;
        setResources(nextResources);
        setActivities(nextActivities);
        const firstResource = nextResources[0]?.slug || '';
        setSelectedResource(firstResource);
        setResourceSettings(cloneResourceDefaults(firstResource, t));
        setStatus(t(firstResource ? 'activityBuilder.ready' : 'activityBuilder.noResources'));
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('activityBuilder.loadResourcesError'));
          setStatus(t('activityBuilder.loadError'));
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function launchActivity(activity) {
    const response = await fetch('/teacher/classroom/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'activity-runner', activity })
    });
    if (!response.ok) throw new Error('Could not open activity for the classroom.');
    navigate('/workshops/activities/teacher');
  }

  async function openFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const resource = payload.resource || payload.config?.resource;
      const config = payload.config?.props ? payload.config : payload.config || payload;
      if (!resources.some((item) => item.slug === resource)) throw new Error('unknown-resource');
      const legacyLabCard = config.labCard ? normalizeWidget({
        id: 'widget-legacy-lab-card',
        type: 'lab-card',
        position: 'left',
        settings: {
          display: config.labCard.type === 'expression' ? 'expression' : 'icon',
          icon: config.labCard.icon || '',
          expression: config.labCard.expression || ''
        }
      }) : null;
      const widgets = (Array.isArray(config.widgets) ? config.widgets.map(normalizeWidget) : legacyLabCard ? [legacyLabCard] : []).slice(0, 2);
      setSelectedResource(resource);
      setResourceSettings({
        ...cloneResourceDefaults(resource, t),
        ...config,
        widgets,
        props: { ...cloneResourceDefaults(resource, t).props, ...(config.props || {}) }
      });
      setTitle(payload.title || payload.name || '');
      setNotes(payload.notes || '');
      setStatus(t('activityBuilder.fileLoaded', { filename: file.name }));
      setError('');
      await launchActivity({
        resource,
        name: payload.title || payload.name || file.name.replace(/\.json$/i, ''),
        notes: payload.notes || '',
        config: { ...config, resource, widgets }
      });
    } catch {
      setError(t('activityBuilder.openFileError'));
    }
  }

  async function openServerActivity() {
    if (!selectedServerActivity) return;
    const [resource, filename] = selectedServerActivity.split('/');
    try {
      const activity = await fetchActivity(resource, filename);
      await launchActivity(activity);
    } catch {
      setError(t('activityBuilder.openFileError'));
    }
  }

  async function saveActivity() {
    if (!selectedResource) {
      setError(t('activityBuilder.selectResource'));
      return;
    }
    if (!title.trim()) {
      setError(t('activityBuilder.titleRequired'));
      return;
    }
    setSaving(true);
    setStatus(t('activityBuilder.saving'));
    setError('');
    try {
      const config = buildActivityConfig(selectedResource, resourceSettings, title);
      await saveActivityRequest(selectedResource, { name: title, config, notes });
      setActivities(await fetchAllActivities());
      setStatus(t('activityBuilder.saved'));
    } catch {
      setError(t('activityBuilder.saveError'));
      setStatus(t('activityBuilder.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const handleResourceChange = (resource) => {
    setSelectedResource(resource);
    setResourceSettings(cloneResourceDefaults(resource, t));
    setError('');
  };

  return (
    <section className="tool-page activity-builder-page">
      <header className="tool-page-header">
        <HeroTitle title={title || t('activityBuilder.title')} />
      </header>
      <EditorPanel
        resources={resources}
        activities={activities}
        selectedServerActivity={selectedServerActivity}
        onSelectedServerActivityChange={setSelectedServerActivity}
        onOpenServerActivity={openServerActivity}
        selectedResource={selectedResource}
        resourceSettings={resourceSettings}
        onSelectedResourceChange={handleResourceChange}
        onResourceSettingsChange={setResourceSettings}
        title={title}
        onTitleChange={(value) => { setTitle(value); if (value.trim()) setError(''); }}
        notes={notes}
        onNotesChange={setNotes}
        onOpenFile={() => fileInput.current?.click()}
        onFileChange={openFile}
        fileInputRef={fileInput}
        onSave={saveActivity}
        saving={saving}
        status={status}
        error={error}
        preview={toJsonString({ resource: selectedResource, title, notes, config: buildActivityConfig(selectedResource, resourceSettings, title) })}
      />
    </section>
  );
}
