import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsAccordion from '../services/SettingsAccordion';
import SharedCommonZoneLayout from '../layouts/SharedCommonZoneLayout';
import WidgetRenderer from '../widgets/widget-renderer';
import FullScreenButton from '../primitives/FullScreenButton';
import './activity-settings-accordion.css';

const DEFAULT_WIDGETS = [];

/** Adds shared activity metadata, side widgets, JSON preview, and persistence. */
export default function ActivitySettingsAccordion({
  resource,
  roomId,
  role = 'student',
  config = {},
  children,
  defaultTitle = ''
}) {
  const { t } = useTranslation('interface');
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const storageKey = `strobe:activity:${resource}:${roomId || 'default'}`;
  const [metadata, setMetadata] = useState(() => {
    try {
      return { title: defaultTitle, subtitle: '', notes: '', widgets: DEFAULT_WIDGETS, ...(JSON.parse(localStorage.getItem(storageKey) || '{}')) };
    } catch {
      return { title: defaultTitle, subtitle: '', notes: '', widgets: DEFAULT_WIDGETS };
    }
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [widgetDraft, setWidgetDraft] = useState(() => JSON.stringify(metadata.widgets || [], null, 2));
  const activityConfig = useMemo(() => ({ ...config, widgets: metadata.widgets || [] }), [config, metadata.widgets]);
  const widgetPositions = new Set((metadata.widgets || []).map((widget) => widget.position));
  const hasLeftWidget = widgetPositions.has('left');
  const hasRightWidget = widgetPositions.has('right');
  const workspaceClass = hasLeftWidget && hasRightWidget
    ? 'activity-workspace--left-right'
    : hasLeftWidget
      ? 'activity-workspace--left'
      : hasRightWidget
        ? 'activity-workspace--right'
        : 'activity-workspace--full';
  const payload = useMemo(() => ({
    resource,
    title: metadata.title || defaultTitle,
    subtitle: metadata.subtitle || '',
    notes: metadata.notes || '',
    config: activityConfig
  }), [resource, metadata, defaultTitle, activityConfig]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...metadata, config }));
  }, [storageKey, metadata, config]);

  function updateWidgetJson(value) {
    setWidgetDraft(value);
    try {
      const widgets = JSON.parse(value);
      if (Array.isArray(widgets)) setMetadata((current) => ({ ...current, widgets: widgets.slice(0, 2) }));
    } catch {
      // Keep the last valid widget configuration while the user edits JSON.
    }
  }

  async function saveActivity() {
    try {
      const response = await fetch(`/teacher/activities/${encodeURIComponent(resource)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.title || defaultTitle, subtitle: payload.subtitle, notes: payload.notes, config: activityConfig, authorName: 'activity-page' })
      });
      if (!response.ok) throw new Error('save-failed');
      setSaveStatus(t('activityWorkspace.saved'));
    } catch {
      setSaveStatus(t('activityWorkspace.saveError'));
    }
  }

  return <>
    <header className="activity-workspace-heading">
      <h1>{metadata.title || defaultTitle}</h1>
      {metadata.subtitle ? <p>{metadata.subtitle}</p> : null}
    </header>
    <section className="common-zone lab-zone activity-common-zone">
      <FullScreenButton />
      <SharedCommonZoneLayout
        className={`activity-workspace ${workspaceClass}`}
        leftPanel={<WidgetRenderer widgets={metadata.widgets} position="left" />}
        centerPanel={<div className="lab-card lab-card--panel">{children}</div>}
        rightPanel={<WidgetRenderer widgets={metadata.widgets} position="right" />}
      />
    </section>
    {isTeacher ? <SettingsAccordion title="activityGeneralSettings" icon="📝">
      <div className="activity-settings-accordion">
        <label><span>{t('activityWorkspace.title')}</span><input value={metadata.title} onChange={(event) => setMetadata({ ...metadata, title: event.target.value })} /></label>
        <label><span>{t('activityWorkspace.subtitle')}</span><input value={metadata.subtitle} onChange={(event) => setMetadata({ ...metadata, subtitle: event.target.value })} /></label>
        <label><span>{t('activityWorkspace.notes')}</span><textarea value={metadata.notes} onChange={(event) => setMetadata({ ...metadata, notes: event.target.value })} /></label>
        <label><span>{t('activityWorkspace.widgets')}</span><textarea rows="5" value={widgetDraft} onChange={(event) => updateWidgetJson(event.target.value)} /></label>
        <div className="activity-settings-accordion__actions"><button type="button" onClick={saveActivity}>{t('activityWorkspace.save')}</button><span role="status">{saveStatus}</span></div>
        <details><summary>{t('activityWorkspace.json')}</summary><pre>{JSON.stringify(payload, null, 2)}</pre></details>
      </div>
    </SettingsAccordion> : null}
  </>;
}
