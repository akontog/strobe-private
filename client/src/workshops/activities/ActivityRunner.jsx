import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  WidgetRenderer,
  AlgebraTiles,
  GeoGebra,
  PlacementBoard,
  OptionsGrid,
  GridButton,
  HeroTitle,
  SettingsAccordion,
  CommonSessionSettings,
  EntryGrid,
  SharedCommonZoneLayout,
  StudentScoresAccordion,
  StudentTable,
  useSessionInputLogger
} from '../../shared/components';
import { readIdentityName } from '../../shared/components/menu/identityStorage';
import './ActivityRunner.css';

function ResourceContent({ activity, role, activityKey }) {
  const session = useSessionInputLogger();
  const config = activity.config || {};
  const props = config.props || {};
  const fields = Array.isArray(props.fields) ? props.fields : [];
  const [answers, setAnswers] = React.useState(() => Object.fromEntries(fields.map((field) => [field.id, field.value || ''])));
  const [placements, setPlacements] = React.useState(props.placements || {});
  const [tiles, setTiles] = React.useState(props.tiles || []);
  const [selectedOption, setSelectedOption] = React.useState('');
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
    setSelectedOption('');
  }, [activity]);

  if (activity.resource === 'input-grid') {
    return (
      <>
        <EntryGrid fields={inputFields} columns={props.columns || 2} rows={props.rows} activity={activityKey} />
        <StudentScoresAccordion
          role={session?.role || 'student'}
          studentName={readIdentityName('')}
          activity={activityKey}
          currentScore={score}
        />
      </>
    );
  }
  if (activity.resource === 'grouping-drag-drop') {
    return <PlacementBoard {...props} placements={placements} onChange={setPlacements} activity={activityKey} />;
  }
  if (activity.resource === 'algebra-tiles') {
    return <AlgebraTiles {...props} shared={Boolean(props.shared)} role={role} variables={props.variables} mode={props.mode || props.layout} tiles={tiles} onTilesChange={setTiles} activity={activityKey} />;
  }
  if (activity.resource === 'collaborative-geogebra') {
    return <GeoGebra {...props} roomId={props.roomId || 'activity-runner'} sessionApp="activity-runner" editable={session?.canEdit} />;
  }
  if (activity.resource === 'collaborative-algebra-tiles') {
    return <AlgebraTiles {...props} shared role={role} sessionApp="activity-runner" activity={activityKey} />;
  }
  if (activity.resource === 'options-grid') {
    const items = Array.isArray(props.items) ? props.items : [];
    const canEdit = session?.canEdit ?? true;
    return (
      <OptionsGrid
        items={items}
        columns={props.columns || 3}
        ariaLabel="Επιλογές"
        renderItem={(item, index) => {
          const itemId = String(item.id || item.value || `option-${index + 1}`);
          const isSelected = selectedOption === itemId;
          return (
            <GridButton
              key={itemId}
              pressed={isSelected}
              disabled={!canEdit}
              onClick={() => {
                const nextOption = isSelected ? '' : itemId;
                setSelectedOption(nextOption);
                session?.logEvent('activity.input.changed', activityKey, {
                  field: 'selectedOption',
                  value: nextOption ? item.label || item.value || itemId : ''
                });
              }}
            >
              {item.label || item.value || itemId}
            </GridButton>
          );
        }}
      />
    );
  }
  return <p>Unsupported activity resource: {activity.resource}</p>;
}

const TILE_SPANS = { one: [2, 2], x: [6, 2], y: [4, 2], x2: [6, 6], xy: [6, 4], y2: [4, 4] };

function formatTileExpression(tiles, variables = ['x', 'y']) {
  const [xVariable = 'x', yVariable = 'y'] = variables;
  const labels = { one: '1', x: xVariable, y: yVariable, x2: `${xVariable}²`, xy: `${xVariable}${yVariable}`, y2: `${yVariable}²` };
  const counts = new Map();
  (tiles || []).forEach((tile) => counts.set(tile.type, (counts.get(tile.type) || 0) + (tile.sign < 0 ? -1 : 1)));
  const terms = ['x2', 'xy', 'y2', 'x', 'y', 'one'].filter((type) => counts.get(type));
  return terms.map((type, index) => {
    const coefficient = counts.get(type);
    const amount = Math.abs(coefficient);
    const body = `${type !== 'one' && amount === 1 ? '' : amount}${labels[type] || type}`;
    return `${index === 0 ? (coefficient < 0 ? '−' : '') : coefficient < 0 ? ' − ' : ' + '}${body}`;
  }).join('') || '0';
}

function getAreaRegions(tiles) {
  const regions = { top: [], left: [], center: [] };
  (tiles || []).forEach((tile) => {
    const [spanX, spanY] = TILE_SPANS[tile.type] || [1, 1];
    const isVertical = tile.orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type);
    const width = isVertical ? spanY : spanX;
    const height = isVertical ? spanX : spanY;
    const centerX = (tile.x || 0) + width / 2;
    const centerY = (tile.y || 0) + height / 2;
    if (centerY < 4 && centerX >= 6) regions.top.push(tile);
    else if (centerY >= 4 && centerX < 6) regions.left.push(tile);
    else if (centerY >= 4 && centerX >= 6) regions.center.push(tile);
  });
  return regions;
}

function getStudentColumns(activity, activityKey) {
  const resource = activity.resource || activity.config?.resource;
  const props = activity.config?.props || {};
  if (resource === 'input-grid') {
    return (props.fields || []).map((field, index) => ({
      key: field.id || field.key || field.label || `field-${index}`,
      label: field.label || field.id || `Πεδίο ${index + 1}`,
      render: (student) => student.answers?.[activityKey]?.[field.id || field.key || field.label || `field-${index}`] ?? '—'
    }));
  }
  if (resource === 'grouping-drag-drop') {
    const groups = new Map((props.groups || []).map((group) => [group.id, group.title || group.id]));
    return (props.items || []).map((item, index) => ({
      key: item.id || `item-${index}`,
      label: typeof item.content === 'string' ? item.content : item.label || item.id || `Στοιχείο ${index + 1}`,
      render: (student) => groups.get(student.answers?.[activityKey]?.[item.id]) || '—'
    }));
  }
  if (resource === 'options-grid') {
    return [{
      key: 'selected-option',
      label: 'Choice',
      render: (student) => student.answers?.[activityKey]?.selectedOption || '—'
    }];
  }
  if (resource === 'algebra-tiles' || resource === 'collaborative-algebra-tiles') {
    const mode = props.mode || props.layout || 'simplified';
    const regions = mode === 'equation'
      ? [{ id: 'left', label: 'Αριστερά' }, { id: 'right', label: 'Δεξιά' }]
      : mode === 'area' || mode === 't-chart'
        ? [{ id: 'top', label: 'Πάνω' }, { id: 'left', label: 'Αριστερά' }, { id: 'center', label: 'Κέντρο' }]
        : [{ id: 'all', label: 'Παράσταση' }];
    return regions.map((region) => ({
      key: `tiles-${region.id}`,
      label: region.label,
      render: (student) => {
        const tiles = student.answers?.[activityKey]?.tiles || [];
        if (region.id === 'left') {
          const selected = mode === 'equation' ? tiles.filter((tile) => tile.side !== 'right') : getAreaRegions(tiles).left;
          return formatTileExpression(selected, props.variables);
        }
        if (region.id === 'right') return formatTileExpression(tiles.filter((tile) => tile.side === 'right'), props.variables);
        if (region.id === 'top') return formatTileExpression(getAreaRegions(tiles).top, props.variables);
        if (region.id === 'center') return formatTileExpression(getAreaRegions(tiles).center, props.variables);
        return formatTileExpression(tiles, props.variables);
      }
    }));
  }
  return [];
}

export default function ActivityRunner({ role = 'student', activity: suppliedActivity = null }) {
  const { t: tNav } = useTranslation('navigation');
  const [activity, setActivity] = React.useState(suppliedActivity);
  const [students, setStudents] = React.useState([]);

  React.useEffect(() => {
    setActivity((current) => JSON.stringify(current) === JSON.stringify(suppliedActivity || null)
      ? current
      : suppliedActivity || null);
  }, [suppliedActivity]);

  React.useEffect(() => {
    if (suppliedActivity) return undefined;
    let cancelled = false;
    const load = () => fetch('/client/classroom/selection', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!cancelled && payload?.app === 'activity-runner' && payload.activity) {
          setActivity((current) => JSON.stringify(current) === JSON.stringify(payload.activity) ? current : payload.activity);
        }
      })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [suppliedActivity]);

  const selectedActivityKey = activity ? `activity-runner:${activity.filename || activity.id || activity.name || 'activity'}` : '';

  React.useEffect(() => {
    if (role !== 'teacher' || !activity) return undefined;
    let cancelled = false;
    const refreshStudents = () => fetch('/api/session-logs/active/activity-runner/students', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (!cancelled) setStudents(Array.isArray(payload?.students) ? payload.students : []); })
      .catch(() => {});
    refreshStudents();
    const timer = window.setInterval(refreshStudents, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activity, role]);

  const config = activity?.config || {};
  const resourceActivity = React.useMemo(() => activity
    ? { ...activity, resource: activity.resource || config.resource }
    : null, [activity, config.resource]);

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

  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const widgetPanel = (position) => <WidgetRenderer widgets={widgets} position={position} />;

  return (
    <>
      <HeroTitle title={`${tNav('items.activities')} - ${activity.name || activity.title || tNav('items.activities')}`} />
      {role === 'teacher' && activity.notes ? <p className="activity-runner-notes">{activity.notes}</p> : null}
      <SharedCommonZoneLayout
        className="common-zone lab-zone"
        leftPanel={widgetPanel('left')}
        centerPanel={(
          <div className="activity-runner-resource">
            <ResourceContent key={selectedActivityKey} activity={resourceActivity} role={role} activityKey={selectedActivityKey} />
          </div>
        )}
        rightPanel={widgetPanel('right')}
      />
      {role === 'teacher' ? <SettingsAccordion><CommonSessionSettings /></SettingsAccordion> : null}
      {role === 'teacher' && ['input-grid', 'grouping-drag-drop', 'algebra-tiles', 'collaborative-algebra-tiles', 'options-grid'].includes(resourceActivity.resource) ? (
        <StudentTable
          title="Πίνακας μαθητών"
          participants={students}
          columns={getStudentColumns(resourceActivity, selectedActivityKey)}
          emptyMessage="Δεν υπάρχουν ακόμη απαντήσεις μαθητών."
        />
      ) : null}
    </>
  );
}
