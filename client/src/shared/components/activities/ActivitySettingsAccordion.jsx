import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import SharedCommonZoneLayout from '../layouts/SharedCommonZoneLayout';
import WidgetRenderer from '../widgets/WidgetRenderer';
import FullScreenButton from '../primitives/FullScreenButton';
import TheoryButton from '../primitives/TheoryButton';
import { getTheoryPath } from '../primitives/workshopTheory';
import ActivityResourcePreview from './ActivityResourcePreview';
import { createActivityDocument } from './activityDocument';
import './ActivitySettingsAccordion.css';

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
  const { t, i18n } = useTranslation('interface');
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const storageKey = `strobe:activity:${resource}:${roomId || 'default'}`;
  const [metadata, setMetadata] = useState(() => {
    try {
      return { title: defaultTitle, subtitle: '', notes: '', theoryMode: 'existing', theoryId: '', newTheoryId: '', newTheoryMarkdown: '# ', widgets: DEFAULT_WIDGETS, ...(JSON.parse(localStorage.getItem(storageKey) || '{}')) };
    } catch {
      return { title: defaultTitle, subtitle: '', notes: '', theoryMode: 'existing', theoryId: '', newTheoryId: '', newTheoryMarkdown: '# ', widgets: DEFAULT_WIDGETS };
    }
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [theories, setTheories] = useState([]);
  const isCreatingTheory = metadata.theoryMode === 'new';
  const selectedTheoryId = isCreatingTheory ? metadata.newTheoryId : metadata.theoryId;
  const newTheoryLines = String(metadata.newTheoryMarkdown || '').split(/\r?\n/);
  const newTheoryHeading = newTheoryLines[0] || '';
  const theoryIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const isNewTheoryValid = theoryIdPattern.test(metadata.newTheoryId)
    && /^#\s+\S.*$/.test(newTheoryHeading)
    && newTheoryLines.slice(1).join('\n').trim().length > 0
    && !theories.some((chapter) => chapter.id === metadata.newTheoryId);
  const theoryPreview = isCreatingTheory
    ? isNewTheoryValid
      ? { title: newTheoryHeading.replace(/^#\s+/, ''), content: newTheoryLines.slice(1).join('\n') }
      : undefined
    : getTheoryPath(metadata.theoryId);

  useEffect(() => {
    if (!isTeacher) return undefined;
    let cancelled = false;
    fetch('/teacher/theory', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (!cancelled) setTheories(Array.isArray(payload?.chapters) ? payload.chapters : []); })
      .catch(() => { if (!cancelled) setTheories([]); });
    return () => { cancelled = true; };
  }, [isTeacher]);
  const activityConfig = useMemo(() => config || {}, [config]);
  const widgetPositions = new Set((metadata.widgets || []).map((widget) => widget.position));
  const hasLeftWidget = widgetPositions.has('left');
  const hasRightWidget = widgetPositions.has('right');
  const hasBottomWidget = widgetPositions.has('bottom');
  const workspaceClass = hasLeftWidget && hasRightWidget
    ? 'activity-workspace--left-right'
    : hasLeftWidget
      ? 'activity-workspace--left'
      : hasRightWidget
        ? 'activity-workspace--right'
        : 'activity-workspace--full';
  const payload = useMemo(() => createActivityDocument({
    resource,
    language: i18n.resolvedLanguage || i18n.language,
    title: metadata.title || defaultTitle,
    objective: metadata.subtitle || '',
    notes: metadata.notes || '',
    theoryId: selectedTheoryId,
    config: activityConfig,
    widgets: metadata.widgets || []
  }), [resource, metadata, selectedTheoryId, defaultTitle, activityConfig, i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...metadata, config }));
  }, [storageKey, metadata, config]);

  async function saveActivity() {
    try {
      let theoryId = selectedTheoryId;
      if (isCreatingTheory) {
        if (!isNewTheoryValid) {
          setSaveStatus('Βάλε μοναδικό όνομα τύπου algebraic-identities και Markdown που ξεκινά με # Τίτλος.');
          return;
        }
        const theoryResponse = await fetch(`/teacher/theory/${encodeURIComponent(theoryId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: metadata.newTheoryMarkdown.trim() })
        });
        if (!theoryResponse.ok) {
          const error = await theoryResponse.json().catch(() => ({}));
          setSaveStatus(error.error || 'Η αποθήκευση της θεωρίας απέτυχε.');
          return;
        }
        const createdTheory = await theoryResponse.json();
        setTheories((current) => [...current, createdTheory].sort((left, right) => left.title.localeCompare(right.title, 'el')));
        setMetadata((current) => ({ ...current, theoryMode: 'existing', theoryId: createdTheory.id }));
      }
      const document = createActivityDocument({
        resource,
        language: i18n.resolvedLanguage || i18n.language,
        title: metadata.title || defaultTitle,
        objective: metadata.subtitle || '',
        notes: metadata.notes || '',
        theoryId,
        config: activityConfig,
        widgets: metadata.widgets || []
      });
      const response = await fetch(`/teacher/activities/${encodeURIComponent(resource)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document, authorName: 'activity-page' })
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
      <TheoryButton theory={theoryPreview} />
      <SharedCommonZoneLayout
        className={`activity-workspace ${workspaceClass}`}
        leftPanel={hasLeftWidget ? <div className="activity-common-zone__widget-column"><WidgetRenderer widgets={metadata.widgets} position="left" /></div> : null}
        centerPanel={<div className="lab-card lab-card--panel">{children}</div>}
        rightPanel={hasRightWidget ? <div className="activity-common-zone__widget-column"><WidgetRenderer widgets={metadata.widgets} position="right" /></div> : null}
        bottomPanel={hasBottomWidget ? <div className="activity-common-zone__widget-bottom"><WidgetRenderer widgets={metadata.widgets} position="bottom" /></div> : null}
      />
    </section>
    {isTeacher ? <Accordion title={t('activityGeneralSettings', { ns: 'common' })} icon="📝">
      <div className="activity-settings-accordion">
        <label><span>{t('activityWorkspace.title')}</span><input value={metadata.title} onChange={(event) => setMetadata({ ...metadata, title: event.target.value })} /></label>
        <label><span>{t('activityWorkspace.subtitle')}</span><input value={metadata.subtitle} onChange={(event) => setMetadata({ ...metadata, subtitle: event.target.value })} /></label>
        <label><span>{t('activityWorkspace.notes')}</span><textarea value={metadata.notes} onChange={(event) => setMetadata({ ...metadata, notes: event.target.value })} /></label>
        <label><span>Θεωρία</span>
          <select value={metadata.theoryMode || 'existing'} onChange={(event) => setMetadata({ ...metadata, theoryMode: event.target.value })}>
            <option value="existing">Επιλογή υπάρχουσας θεωρίας</option>
            <option value="new">Δημιουργία νέας θεωρίας</option>
          </select>
        </label>
        {isCreatingTheory ? <div className="activity-theory-editor">
          <label><span>Όνομα αρχείου</span>
            <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="algebraic-identities" value={metadata.newTheoryId}
              onChange={(event) => setMetadata({ ...metadata, newTheoryId: event.target.value })} />
          </label>
          <label><span>Κεφάλαιο Markdown (πρώτη γραμμή: # Τίτλος)</span>
            <textarea required value={metadata.newTheoryMarkdown} onChange={(event) => setMetadata({ ...metadata, newTheoryMarkdown: event.target.value })} />
          </label>
          {!isNewTheoryValid ? <p role="alert">Χρειάζεται μοναδικό όνομα με πεζά λατινικά και παύλες, τίτλος # Τίτλος και περιεχόμενο.</p> : null}
        </div> : <label><span>Κεφάλαιο</span>
          <select value={metadata.theoryId || ''} onChange={(event) => setMetadata({ ...metadata, theoryId: event.target.value })}>
            <option value="">Χωρίς θεωρία</option>
            {theories.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
          </select>
        </label>}
        <ActivityResourcePreview resource={resource} widgets={metadata.widgets || []} onChange={(widgets) => setMetadata({ ...metadata, widgets })} />
        <div className="activity-settings-accordion__actions"><button type="button" onClick={saveActivity} disabled={isCreatingTheory && !isNewTheoryValid}>{t('activityWorkspace.save')}</button><span role="status">{saveStatus}</span></div>
        <details><summary>{t('activityWorkspace.json')}</summary><pre>{JSON.stringify(payload, null, 2)}</pre></details>
      </div>
    </Accordion> : null}
  </>;
}
