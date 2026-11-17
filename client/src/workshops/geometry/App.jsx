import React, { useEffect, useMemo, useState } from 'react';
import '../../shared/i18n';
import {
  ActivitiesAccordion,
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

export default function App({ role = 'student' }) {
  const requestedActivityId = new URLSearchParams(window.location.search).get('activity') || '';
  const initialActivity = ACTIVITY_LIBRARY.find((entry) => entry.id === requestedActivityId) || ACTIVITY_LIBRARY[0];
  const [selectedActivityId, setSelectedActivityId] = useState(initialActivity.id);
  const [placementsByActivity, setPlacementsByActivity] = useState({});
  const [participants, setParticipants] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const session = useSessionInputLogger();
  const isTeacher = role === 'teacher';
  const activity = ACTIVITY_LIBRARY.find((entry) => entry.id === selectedActivityId) || initialActivity;
  const dataset = datasets[activity.datasetId] || { groups: [], items: [] };
  const isVennActivity = Array.isArray(dataset.diagram?.sets) && dataset.diagram.sets.length > 0;
  const activityGroups = isVennActivity ? dataset.diagram.regions || [] : dataset.groups || [];
  const placements = placementsByActivity[activity.id] || {};
  const sessionActivity = `geometry:${activity.id}`;
  const activityOptions = ACTIVITY_LIBRARY.map((entry) => ({
    value: entry.id,
    label: `${entry.code} ${entry.title}`
  }));
  const currentScore = useMemo(() => dataset.items.reduce((score, item) => {
    const placedZone = typeof placements[item.id] === 'object' ? placements[item.id]?.region : placements[item.id];
    if (!placedZone) return score;
    const correctZone = item.correctRegionId || item.correctGroupId;
    return score + (placedZone === correctZone
      ? dataset.scoreCorrect ?? 1
      : dataset.scoreIncorrect ?? 0);
  }, 0), [dataset, placements]);

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
    if (isTeacher || !session?.activeSessionId || !session.activeActivity) return;
    const activeActivity = ACTIVITY_LIBRARY.find((entry) => session.activeActivity.startsWith(`${entry.code} `));
    if (activeActivity && activeActivity.id !== selectedActivityId) {
      setSelectedActivityId(activeActivity.id);
    }
  }, [isTeacher, selectedActivityId, session?.activeActivity, session?.activeSessionId]);

  useEffect(() => {
    if (!isTeacher || !session?.activeSessionId) {
      setParticipants([]);
      return undefined;
    }

    let cancelled = false;
    const loadParticipants = async () => {
      try {
        const response = await fetch('/api/session-logs/active/geometry-lab/students', { cache: 'no-store' });
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
  }, [isTeacher, session?.activeSessionId]);

  const getParticipantPlacements = (participant) => (
    participant.answers?.[sessionActivity] || participant.answers?.[activity.id] || {}
  );
  const getParticipantScore = (participant) => dataset.items.reduce((score, item) => {
    const placement = getParticipantPlacements(participant)[item.id];
    const placedZone = typeof placement === 'object' ? placement?.region : placement;
    if (!placedZone) return score;
    const correctZone = item.correctRegionId || item.correctGroupId;
    return score + (placedZone === correctZone
      ? dataset.scoreCorrect ?? 1
      : dataset.scoreIncorrect ?? 0);
  }, 0);

  return (
    <>
      <HeroTitle
        title={`${activityData.workshop.title} - ${activity.code} ${activity.title}`}
        subtitle={activity.objective}
      />
      <section className="common-zone lab-zone">
        <FullScreenButton />
        <TheoryButton theory={getTheoryPath(activity.theoryId)} />
        <SharedCommonZoneLayout leftPanel={(
          <aside className="lab-card lab-card--panel" style={{ flex: '0 1 320px', maxWidth: 320, width: '100%' }}>
            <WidgetRenderer widgets={(activity.widgets || []).map((widget) => ({ ...widget, position: widget.region }))} position="left" />
          </aside>
        )} centerPanel={(
          <div className="lab-card lab-card--panel">
            {isVennActivity ? (
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
          preserveSession
        />
      )}

      {isTeacher && (
        <GroupsAccordion
          participants={participants}
          emptyMessage="Δεν υπάρχουν ακόμη μαθητές στη συνεδρία."
          columns={activityGroups.map((group) => ({
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
          }])}
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
