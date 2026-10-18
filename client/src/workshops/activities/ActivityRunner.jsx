import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  WidgetRenderer,
  AlgebraTiles,
  CollaborativeGeoGebra,
  GroupingDragDrop,
  HeroTitle,
  SettingsAccordion,
  CommonSessionSettings,
  InputGrid,
  SharedCommonZoneLayout,
  StudentScoresAccordion,
  useSessionInputLogger
} from '../../shared/components';
import { readIdentityName } from '../../shared/components/menu/identityStorage';
import './ActivityRunner.css';

function ResourceContent({ activity }) {
  const session = useSessionInputLogger();
  const config = activity.config || {};
  const props = config.props || {};
  const fields = Array.isArray(props.fields) ? props.fields : [];
  const [answers, setAnswers] = React.useState(() => Object.fromEntries(fields.map((field) => [field.id, field.value || ''])));
  const [placements, setPlacements] = React.useState(props.placements || {});
  const [tiles, setTiles] = React.useState(props.tiles || []);
  const correctAnswers = config.grading?.answers || {};
  const inputFields = fields.map((field) => ({
    ...field,
    value: answers[field.id] ?? '',
    onChange: (value) => setAnswers((current) => ({ ...current, [field.id]: value }))
  }));
  const score = fields.filter((field) => {
    const expected = correctAnswers[field.id] ?? field.correctAnswer;
    return expected !== undefined && String(answers[field.id] ?? '').trim() === String(expected).trim();
  }).length;

  React.useEffect(() => {
    setAnswers(Object.fromEntries(fields.map((field) => [field.id, field.value || ''])));
    setPlacements(props.placements || {});
    setTiles(props.tiles || []);
  }, [activity]);

  if (activity.resource === 'input-grid') {
    return (
      <>
        <InputGrid fields={inputFields} columns={props.columns || 2} rows={props.rows} activity={activity.name} />
        <StudentScoresAccordion
          role={session?.role || 'student'}
          studentName={readIdentityName('')}
          activity={`activity-runner:${activity.name || 'activity'}`}
          currentScore={score}
        />
      </>
    );
  }
  if (activity.resource === 'grouping-drag-drop') {
    return <GroupingDragDrop {...props} placements={placements} onChange={setPlacements} activity={activity.name} />;
  }
  if (activity.resource === 'algebra-tiles') {
    return <AlgebraTiles tiles={tiles} onTilesChange={setTiles} activity={activity.name} />;
  }
  if (activity.resource === 'collaborative-geogebra') {
    return <CollaborativeGeoGebra {...props} roomId={props.roomId || 'activity-runner'} sessionApp="activity-runner" editable={session?.canEdit} />;
  }
  return <p>Unsupported activity resource: {activity.resource}</p>;
}

export default function ActivityRunner({ role = 'student', activity: suppliedActivity = null }) {
  const { t: tNav } = useTranslation('navigation');
  const [activity, setActivity] = React.useState(suppliedActivity);

  React.useEffect(() => {
    setActivity(suppliedActivity || null);
  }, [suppliedActivity]);

  React.useEffect(() => {
    if (suppliedActivity) return undefined;
    let cancelled = false;
    const load = () => fetch('/client/classroom/selection', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!cancelled && payload?.app === 'activity-runner' && payload.activity) setActivity(payload.activity);
      })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [suppliedActivity]);

  if (!activity) {
    return (
      <>
        <HeroTitle title={tNav('items.activities')} />
        <section className="common-zone lab-zone">
          {role === 'teacher' ? <p>Επιλέξτε δραστηριότητα από τις <Link to="/tools/activity-builder">Ρυθμίσεις δραστηριοτήτων</Link>.</p> : <p>Περιμένετε να ανοίξει ο/η εκπαιδευτικός μια δραστηριότητα.</p>}
        </section>
        {role === 'teacher' ? <SettingsAccordion><CommonSessionSettings /></SettingsAccordion> : null}
      </>
    );
  }

  const config = activity.config || {};
  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const widgetPanel = (position) => <WidgetRenderer widgets={widgets} position={position} />;
  const resourceActivity = { ...activity, resource: activity.resource || config.resource };

  return (
    <>
      <HeroTitle title={`${tNav('items.activities')} - ${activity.name || activity.title || tNav('items.activities')}`} />
      {role === 'teacher' && activity.notes ? <p className="activity-runner-notes">{activity.notes}</p> : null}
      <SharedCommonZoneLayout
        className="common-zone lab-zone"
        leftPanel={widgetPanel('left')}
        centerPanel={(
          <div className="activity-runner-resource">
            <ResourceContent activity={resourceActivity} />
          </div>
        )}
        rightPanel={widgetPanel('right')}
      />
      {role === 'teacher' ? <SettingsAccordion><CommonSessionSettings /></SettingsAccordion> : null}
    </>
  );
}
