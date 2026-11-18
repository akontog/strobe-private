import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../shared/i18n';
import {
  ActivitiesAccordion,
  CartesianPlane,
  CollaborativeGeoGebra,
  EquationWidget,
  FullScreenButton,
  GroupsAccordion,
  HeroTitle,
  PlacementBoard,
  SharedCommonZoneLayout,
  TheoryButton,
  VennBoard,
  WidgetRenderer,
  readIdentityName,
  useSessionInputLogger
} from '../../shared/components';
import { resolveWorkshopDocument } from '../../shared/components/activities/activityDocument';
import { getTheoryPath } from '../../shared/components/primitives/workshopTheory';
import storedActivityData from './data/activities.json';
const standaloneActivityDocuments = Object.values(import.meta.glob('./data/activities/*.json', {
  eager: true,
  import: 'default'
}));

const activityData = resolveWorkshopDocument(storedActivityData, standaloneActivityDocuments);
const { activities: ACTIVITY_LIBRARY, datasets } = activityData;
const ANGLE_ASSIGNMENTS = [
  { id: 'acute', label: 'Οξεία γωνία', expression: '\\text{Οξεία γωνία}', triangleLabel: 'Οξυγώνιο τρίγωνο', triangleExpression: '\\text{Οξυγώνιο τρίγωνο}' },
  { id: 'obtuse', label: 'Αμβλεία γωνία', expression: '\\text{Αμβλεία γωνία}', triangleLabel: 'Αμβλυγώνιο τρίγωνο', triangleExpression: '\\text{Αμβλυγώνιο τρίγωνο}' },
  { id: 'right', label: 'Ορθή γωνία', expression: '\\text{Ορθή γωνία}', triangleLabel: 'Ορθογώνιο τρίγωνο', triangleExpression: '\\text{Ορθογώνιο τρίγωνο}' }
];

function getAngleAssignment(sessionId, studentName, activityId = '1.1') {
  const source = `${sessionId}:${activityId}:${String(studentName || '').trim().toLocaleLowerCase('el-GR')}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  }
  const assignment = ANGLE_ASSIGNMENTS[(hash >>> 0) % ANGLE_ASSIGNMENTS.length];
  return activityId === '1.3'
    ? { ...assignment, label: assignment.triangleLabel, expression: assignment.triangleExpression }
    : assignment;
}

function classifyTriangle(point) {
  if (!point) return '';
  if (Math.abs(Number(point.y) + 1) < 0.2) return '';
  const vertices = [{ x: -4, y: -1 }, { x: 4, y: -1 }, { x: Number(point.x), y: Number(point.y) }];
  const sideSquares = [
    Math.hypot(vertices[0].x - vertices[1].x, vertices[0].y - vertices[1].y) ** 2,
    Math.hypot(vertices[1].x - vertices[2].x, vertices[1].y - vertices[2].y) ** 2,
    Math.hypot(vertices[2].x - vertices[0].x, vertices[2].y - vertices[0].y) ** 2
  ].sort((first, second) => first - second);
  if (!sideSquares.every(Number.isFinite) || sideSquares[0] < 0.01) return '';
  const difference = sideSquares[2] - sideSquares[0] - sideSquares[1];
  const rightTolerance = sideSquares[2] * 0.07;
  if (Math.abs(difference) <= rightTolerance) return 'right';
  return difference < 0 ? 'acute' : 'obtuse';
}

function classifyAngle(ray) {
  const x = Number(ray?.end?.x) - Number(ray?.start?.x);
  const y = Number(ray?.end?.y) - Number(ray?.start?.y);
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length < 0.05) return '';
  const angle = Math.acos(Math.max(-1, Math.min(1, x / length))) * (180 / Math.PI);
  if (Math.abs(angle - 90) <= 5) return 'right';
  return angle < 90 ? 'acute' : 'obtuse';
}

function readRayAnswer(participant) {
  const raw = participant.answers?.['1.1']?.cartesianRay;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readTrianglePoint(participant) {
  const raw = participant.answers?.['1.3']?.cartesianPoint;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App({ role = 'student' }) {
  const requestedActivityId = new URLSearchParams(window.location.search).get('activity') || '';
  const previousRequestedActivityId = useRef(requestedActivityId);
  const initialActivity = ACTIVITY_LIBRARY.find((entry) => entry.id === requestedActivityId) || ACTIVITY_LIBRARY[0];
  const [selectedActivityId, setSelectedActivityId] = useState(initialActivity.id);
  const [placementsByActivity, setPlacementsByActivity] = useState({});
  const [cartesianRays, setCartesianRays] = useState([]);
  const [cartesianPoints, setCartesianPoints] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const session = useSessionInputLogger();
  const isTeacher = role === 'teacher';
  const activity = ACTIVITY_LIBRARY.find((entry) => entry.id === selectedActivityId) || initialActivity;
  const dataset = datasets[activity.datasetId] || { groups: [], items: [] };
  const isVennActivity = Array.isArray(dataset.diagram?.sets) && dataset.diagram.sets.length > 0;
  const isCartesianPlaneActivity = ['cartesian-plane', 'cartesian-triangle'].includes(activity.mode);
  const isGeoGebraActivity = activity.mode === 'geogebra';
  const isRayAngleActivity = activity.mode === 'cartesian-plane';
  const isTriangleConstructionActivity = activity.mode === 'cartesian-triangle';
  const activityGroups = isVennActivity ? dataset.diagram.regions || [] : dataset.groups || [];
  const placements = placementsByActivity[activity.id] || {};
  const sessionActivity = `geometry:${activity.id}`;
  const assignedAngle = !isTeacher && isCartesianPlaneActivity && session?.activeSessionId
    ? getAngleAssignment(session.activeSessionId, studentName, activity.id)
    : null;
  const cartesianRay = cartesianRays[cartesianRays.length - 1] || null;
  const cartesianPoint = cartesianPoints[cartesianPoints.length - 1] || null;
  const cartesianAnswerIsCorrect = Boolean(assignedAngle && (isRayAngleActivity
    ? cartesianRay && classifyAngle(cartesianRay) === assignedAngle.id
    : isTriangleConstructionActivity && cartesianPoint && classifyTriangle(cartesianPoint) === assignedAngle.id));
  const activityOptions = ACTIVITY_LIBRARY.map((entry) => ({
    value: entry.id,
    label: `${entry.code} ${entry.title}`
  }));
  const currentScore = useMemo(() => {
    if (isCartesianPlaneActivity) return cartesianAnswerIsCorrect ? 1 : 0;
    return dataset.items.reduce((score, item) => {
    const placedZone = typeof placements[item.id] === 'object' ? placements[item.id]?.region : placements[item.id];
    if (!placedZone) return score;
    const correctZone = item.correctRegionId || item.correctGroupId;
    return score + (placedZone === correctZone
      ? dataset.scoreCorrect ?? 1
      : dataset.scoreIncorrect ?? 0);
    }, 0);
  }, [cartesianAnswerIsCorrect, dataset, isCartesianPlaneActivity, placements]);

  useEffect(() => {
    if (previousRequestedActivityId.current === requestedActivityId) return;
    previousRequestedActivityId.current = requestedActivityId;
    const nextActivity = ACTIVITY_LIBRARY.find((entry) => entry.id === requestedActivityId);
    if (nextActivity) setSelectedActivityId(nextActivity.id);
  }, [requestedActivityId]);

  useEffect(() => {
    const syncIdentity = (event) => setStudentName(String(event.detail?.name || readIdentityName('Student')).trim());
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    setCartesianRays([]);
    setCartesianPoints([]);
  }, [activity.id, session?.activeSessionId]);

  useEffect(() => {
    if (isTeacher || !session?.activeSessionId) return;
    const activeActivity = ACTIVITY_LIBRARY.find((entry) => (
      String(entry.id) === String(session.activeActivityId)
    )) || ACTIVITY_LIBRARY.find((entry) => (
      session.activeActivity?.startsWith(`${entry.code} `)
    ));
    if (activeActivity && activeActivity.id !== selectedActivityId) {
      setSelectedActivityId(activeActivity.id);
    }
  }, [isTeacher, selectedActivityId, session?.activeActivity, session?.activeActivityId, session?.activeSessionId]);

  useEffect(() => {
    if (!isTeacher) {
      setParticipants([]);
      return undefined;
    }

    let cancelled = false;
    const loadParticipants = async () => {
      try {
        const response = await fetch(`/api/session-logs/active/geometry-lab/students?activityId=${encodeURIComponent(activity.id)}`, { cache: 'no-store' });
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) setParticipants(Array.isArray(payload?.students) ? payload.students : []);
      } catch {
        if (!cancelled) setParticipants([]);
      }
    };

    loadParticipants();
    const timer = window.setInterval(loadParticipants, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activity.id, isTeacher, session?.activeSessionId]);

  const getParticipantPlacements = (participant) => (
    participant.answers?.[sessionActivity] || participant.answers?.[activity.id] || {}
  );
  const getParticipantScore = (participant) => {
    if (isCartesianPlaneActivity) {
      const answer = isRayAngleActivity ? classifyAngle(readRayAnswer(participant)) : classifyTriangle(readTrianglePoint(participant));
      return answer === getAngleAssignment(session?.activeSessionId || participant.sessionId, participant.name, activity.id).id ? 1 : 0;
    }
    return dataset.items.reduce((score, item) => {
    const placement = getParticipantPlacements(participant)[item.id];
    const placedZone = typeof placement === 'object' ? placement?.region : placement;
    if (!placedZone) return score;
    const correctZone = item.correctRegionId || item.correctGroupId;
    return score + (placedZone === correctZone
      ? dataset.scoreCorrect ?? 1
      : dataset.scoreIncorrect ?? 0);
    }, 0);
  };

  return (
    <>
      <HeroTitle
        title={`${activityData.workshop.title} - ${activity.code} ${activity.title}`}
        subtitle={activity.objective}
      />
      <section className="common-zone lab-zone">
        <FullScreenButton />
        <TheoryButton theory={getTheoryPath(activity.theoryId)} />
        <SharedCommonZoneLayout leftPanel={isGeoGebraActivity ? null : (
          <aside className="lab-card lab-card--panel" style={{ flex: '0 1 320px', maxWidth: 320, width: '100%' }}>
            {assignedAngle ? (
              <EquationWidget expression={assignedAngle.expression} />
            ) : null}
            <WidgetRenderer widgets={(activity.widgets || []).map((widget) => ({ ...widget, position: widget.region }))} position="left" />
          </aside>
        )} centerPanel={(
          <div className="lab-card lab-card--panel">
            {isGeoGebraActivity ? (
              <CollaborativeGeoGebra
                roomId={activity.resourceSettings.roomId}
                sessionApp="geometry-lab"
                editable={isTeacher || Boolean(session?.activeSessionId)}
                showToolBar
                showAlgebraView={false}
                showAlgebraInput={false}
                showMenuBar={false}
                showResetIcon={false}
                showZoomButtons={false}
                showFullscreenButton={false}
                showSuggestionButtons={false}
                initialCommands={activity.resourceSettings.initialCommands}
                fixedObjectNames={activity.resourceSettings.fixedObjectNames}
              />
            ) : isCartesianPlaneActivity ? (
              <CartesianPlane
                roomId={`${sessionActivity}:${session?.activeSessionId || 'preview'}`}
                sessionApp="geometry-lab"
                canEdit={isTeacher || Boolean(session?.activeSessionId)}
                onLinesChange={setCartesianRays}
                onPointsChange={setCartesianPoints}
                {...activity.resourceSettings}
              />
            ) : isVennActivity ? (
              <VennBoard
                activity={sessionActivity}
                items={dataset.items}
                diagram={dataset.diagram}
                placements={placements}
                onChange={(nextPlacements) => setPlacementsByActivity((current) => ({
                  ...current,
                  [activity.id]: nextPlacements
                }))}
                bankLabel={dataset.bankLabel || ''}
              />
            ) : (
              <PlacementBoard
                activity={sessionActivity}
                items={dataset.items}
                groups={activityGroups}
                placements={placements}
                onChange={(nextPlacements) => setPlacementsByActivity((current) => ({
                  ...current,
                  [activity.id]: nextPlacements
                }))}
                bankLabel={dataset.bankLabel || ''}
              />
            )}
          </div>
        )} />
      </section>

      {isTeacher && (
        <ActivitiesAccordion
          options={activityOptions}
          value={activity.id}
          onChange={setSelectedActivityId}
        />
      )}

      {isTeacher && (
        <GroupsAccordion
          participants={participants}
          emptyMessage="Δεν υπάρχουν ακόμη μαθητές στη συνεδρία."
          columns={(isCartesianPlaneActivity ? [
            {
              key: 'assigned-angle',
              label: 'Ανάθεση',
              render: (participant) => getAngleAssignment(session?.activeSessionId || participant.sessionId, participant.name, activity.id).label
            },
            {
              key: 'drawn-angle',
              label: 'Γωνία που σχεδιάστηκε',
              render: (participant) => {
                const kind = isRayAngleActivity
                  ? classifyAngle(readRayAnswer(participant))
                  : classifyTriangle(readTrianglePoint(participant));
                const result = ANGLE_ASSIGNMENTS.find((entry) => entry.id === kind);
                return (isTriangleConstructionActivity ? result?.triangleLabel : result?.label) || '—';
              }
            },
            {
              key: 'score',
              label: 'Βαθμολογία',
              render: (participant) => `${getParticipantScore(participant)} / 1`
            }
          ] : activityGroups.map((group) => ({
            key: group.id,
            label: group.title,
            render: (participant) => dataset.items
              .filter((item) => {
                const placement = getParticipantPlacements(participant)[item.id];
                return (typeof placement === 'object' ? placement?.region : placement) === group.id;
              })
              .map((item) => item.content)
              .join(', ') || '—'
          })).concat([{
            key: 'score',
            label: 'Βαθμολογία',
            render: (participant) => `${getParticipantScore(participant)} / ${dataset.items.length * (dataset.scoreCorrect ?? 1)}`
          }]))}
        />
      )}

      <GroupsAccordion
        role={role}
        studentName={studentName}
        activity={sessionActivity}
        currentScore={currentScore}
      />
    </>
  );
}
