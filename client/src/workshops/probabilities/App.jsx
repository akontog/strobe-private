import React, { useEffect, useMemo, useState } from 'react';
import '../../shared/i18n';
import './App.css';
import {
  ActivitiesAccordion, FullScreenButton, HeroTitle, readIdentityName, SharedCommonZoneLayout,
  StudentsAccordion, useSessionInputLogger, VennBoard
} from '../../shared/components';
import storedActivityData from './data/activities.json';
import { resolveWorkshopDocument } from '../../shared/components/activities/activityDocument';

const activityData = resolveWorkshopDocument(storedActivityData);

export default function App({ role = 'student' }) {
  const labels = activityData.labels || {};
  const t = (key, options = {}) => {
    const template = labels[key] || key;
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, name) => (options?.[name] ?? ''));
  };
  const [placements, setPlacements] = useState({});
  const [selectedActivityId, setSelectedActivityId] = useState(activityData.activities[0].id);
  const [participants, setParticipants] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const session = useSessionInputLogger();
  const isTeacher = role === 'teacher';
  const activity = activityData.activities.find((entry) => entry.id === selectedActivityId) || activityData.activities[0];
  const diagram = {
    ...activity.diagram,
    sets: activity.diagram.sets,
    regions: activity.diagram.regions
  };
  const activityOptions = activityData.activities.map((entry) => ({ value: entry.id, label: `${entry.code} ${entry.title}` }));
  const currentScore = useMemo(() => activity.items.reduce((score, item) => {
    const placement = placements[item.id];
    const region = typeof placement === 'object' ? placement?.region : placement;
    if (!region) return score;
    return score + (region === activity.correctPlacementByItem[item.id] ? activity.scoreCorrect : activity.scoreIncorrect);
  }, 0), [placements]);

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
    const activeActivity = activityData.activities.find((entry) => session.activeActivity.startsWith(`${entry.code} `));
    if (activeActivity && activeActivity.id !== selectedActivityId) {
      setSelectedActivityId(activeActivity.id);
      setPlacements({});
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
        const response = await fetch('/api/session-logs/active/probabilities-lab/students', { cache: 'no-store' });
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

  const getStudentPlacements = (participant) => participant.answers?.[activity.id] || {};
  const getStudentScore = (participant) => Object.entries(getStudentPlacements(participant)).reduce((score, [itemId, region]) => (
    score + (region === activity.correctPlacementByItem[itemId] ? activity.scoreCorrect : activity.scoreIncorrect)
  ), 0);
  const renderNumbersForRegion = (participant, regionId) => {
    const numbers = Object.entries(getStudentPlacements(participant))
      .filter(([, region]) => region === regionId)
      .map(([itemId]) => itemId)
      .sort((left, right) => Number(left) - Number(right));
    return numbers.length ? numbers.join(', ') : 'β€”';
  };

  return (
    <>
      <HeroTitle
        title={`${activityData.workshop.title} - ${activity.code} ${activity.title}`}
        subtitle={activity.objective}
      />
      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout isGroupingMode centerPanel={(
          <div className="lab-card lab-card--panel probabilities-workspace" aria-label={activity.objective}>
            <VennBoard
              activity={`probabilities:${activity.id}`}
              items={activity.items}
              diagram={diagram}
              placements={placements}
              onChange={setPlacements}
              bankLabel={activity.bankLabel}
            />
          </div>
        )} />
      </section>
      {isTeacher ? (
        <ActivitiesAccordion
          title={t('activities')}
          label={t('chooseActivity')}
          options={activityOptions}
          value={activity.id}
          onChange={(nextId) => {
            setSelectedActivityId(nextId);
            setPlacements({});
          }}
          preserveSession
        />
      ) : null}
      {isTeacher ? (
        <StudentsAccordion
          title={t('studentTableTitle')}
          participants={participants}
          emptyMessage={t('noStudents')}
          columns={activity.diagram.regions.map((region) => (
            { key: region.id, label: region.title, render: (participant) => renderNumbersForRegion(participant, region.id) }
          )).concat([
            { key: 'score', label: t('score'), render: (participant) => `${getStudentScore(participant)} / ${activity.items.length * activity.scoreCorrect}` }
          ])}
        />
      ) : null}
      <StudentsAccordion
        role={role}
        studentName={studentName}
        activity={`probabilities:${activity.id}`}
        currentScore={currentScore}
      />
    </>
  );
}
