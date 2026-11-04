import React, { useEffect, useRef, useState } from 'react';
import '../../shared/i18n';
import {
  ActivitiesAccordion,
  AlgebraTiles,
  PlacementBoard,
  DataAccordion,
  FullScreenButton,
  HeroTitle,
  SharedCommonZoneLayout,
  GroupsAccordion,
  createPlacementGroupColumns,
  WidgetRenderer,
  readIdentityName
} from '../../shared/components';
import storedActivityData from './data/activities.json';
const standaloneActivityDocuments = Object.values(import.meta.glob('./data/activities/*.json', { eager: true, import: 'default' }));
import { resolveWorkshopDocument } from '../../shared/components/activities/activityDocument';
import { getAlgebraTileRegionScore } from '../../shared/components/resources/algebraTileScoring';
import './App.css';

const activityData = resolveWorkshopDocument(storedActivityData, standaloneActivityDocuments);
const activityDocuments = new Map(standaloneActivityDocuments.map((document) => [String(document.activity?.id || ''), document]));
const defaultTileActivity = activityData.activities.find((entry) => Array.isArray(entry.questions));
const TILE_WIDTH_UNITS = { x: 6, x2: 6, one: 2 };

function formatTileRegion(tiles, side) {
  const counts = { x2: 0, x: 0, one: 0 };
  (Array.isArray(tiles) ? tiles : []).forEach((tile) => {
    if (!Object.hasOwn(counts, tile.type)) return;
    if (tile.side === 'right' ? side !== 'right' : side === 'right') return;
    counts[tile.type] += tile.sign < 0 ? -1 : 1;
  });

  const parts = [];
  if (counts.x2) {
    const magnitude = Math.abs(counts.x2) === 1 ? '' : Math.abs(counts.x2);
    parts.push({ sign: counts.x2 < 0 ? -1 : 1, value: `${magnitude}x²` });
  }
  if (counts.x) {
    const magnitude = Math.abs(counts.x) === 1 ? '' : Math.abs(counts.x);
    parts.push({ sign: counts.x < 0 ? -1 : 1, value: `${magnitude}x` });
  }
  if (counts.one) parts.push({ sign: counts.one < 0 ? -1 : 1, value: String(Math.abs(counts.one)) });
  if (!parts.length) return '';
  return parts.map((part, index) => {
    if (index === 0) return part.sign < 0 ? `−${part.value}` : part.value;
    return `${part.sign < 0 ? ' − ' : ' + '}${part.value}`;
  }).join('');
}

function createInitialTiles(question) {
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const gridUnit = Math.max(10, Math.min(18, Math.round(viewportWidth * 0.028 * 100) / 100));
  const availableSideWidth = Math.max(0, (viewportWidth - 48) / 2 - 8);
  const maxRowWidth = Math.max(8, Math.min(12, Math.floor(availableSideWidth / gridUnit)));
  let sequence = 0;
  return ['left', 'right'].flatMap((side) => {
    const terms = side === 'left' ? question.leftTerms : question.rightTerms;
    let x = 0;
    let y = 0;
    return terms.flatMap((term) => Array.from({ length: term.count }, () => {
      const width = TILE_WIDTH_UNITS[term.type] || 2;
      if (x + width > maxRowWidth) {
        x = 0;
        y += 2;
      }
      const tile = {
        id: `${question.id}-${side}-${sequence++}`,
        type: term.type,
        sign: term.sign < 0 ? -1 : 1,
        orientation: 'horizontal',
        side,
        x,
        y
      };
      x += width;
      return tile;
    }));
  });
}

export default function App({ role = 'student' }) {
  const isTeacher = role === 'teacher';
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => defaultTileActivity.questions[0].id);
  const [selectedActivityId, setSelectedActivityId] = useState(() => activityData.activities[0]?.id || defaultTileActivity.id);
  const [placements, setPlacements] = useState({});
  const [tiles, setTiles] = useState(() => createInitialTiles(defaultTileActivity.questions[0]));
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const lessonQuestionRef = useRef('');

  const selectedActivity = activityData.activities.find((entry) => String(entry.id) === String(selectedActivityId));
  const activeTileActivity = Array.isArray(selectedActivity?.questions) ? selectedActivity : defaultTileActivity;
  const labels = activeTileActivity.labels?.resourceTable
    ? activeTileActivity.labels
    : defaultTileActivity.labels || activityData.labels || {};
  const t = (key) => labels[key] || key;
  const questions = activeTileActivity?.questions || [];
  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) || questions[0] || defaultTileActivity.questions[0];
  const tileWidget = activeTileActivity?.widgets?.find((widget) => widget.type === 'algebra-tiles') || defaultTileActivity.widgets.find((widget) => widget.type === 'algebra-tiles');
  const equationWidget = activeTileActivity?.widgets?.find((widget) => widget.type === 'equation' && widget.region === 'left');
  const isPlacementActivity = selectedActivity?.mode === 'placement-board';
  const activeActivityDocument = activityDocuments.get(String(selectedActivityId));
  const activePlacementData = activeActivityDocument?.resources?.find((resource) => resource.type === 'placement-board')?.config?.data || {};
  const activePlacementActivity = activeActivityDocument?.activity;
  const currentScore = getAlgebraTileRegionScore(tiles, tileWidget.mode || tileWidget.layout, selectedQuestion.tileScoring).score;

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
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/equations-lab`);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        if (cancelled) return;
        setConnected(true);
        socket.send(JSON.stringify({ type: isTeacher ? 'register_teacher' : 'register_student', name: isTeacher ? 'Teacher' : studentName }));
        socket.send(JSON.stringify({ type: 'request_state' }));
        if (isTeacher) {
          socket.send(JSON.stringify({
            type: 'teacher_lesson',
            lesson: { activityId: selectedActivityId, questionId: selectedQuestionId },
            tiles: createInitialTiles(selectedQuestion)
          }));
        }
      });

      socket.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message?.type !== 'equations_state') return;
        if (Array.isArray(message.participants)) setParticipants(message.participants);
        if (!isTeacher && message.lesson?.activityId) setSelectedActivityId(String(message.lesson.activityId));
        if (!isTeacher && Array.isArray(message.participants)) {
          const ownParticipant = message.participants.find((participant) => participant.name?.trim().toLowerCase() === studentName.trim().toLowerCase());
          if (ownParticipant?.placements) setPlacements(ownParticipant.placements);
        }
        if (!isTeacher && message.lesson?.questionId) setSelectedQuestionId(message.lesson.questionId);
        if (Array.isArray(message.tiles) && message.lesson?.questionId !== lessonQuestionRef.current) {
          lessonQuestionRef.current = message.lesson?.questionId || '';
          const ownTiles = message.participants?.find((participant) => participant.name?.trim().toLowerCase() === studentName.trim().toLowerCase())?.tiles;
          setTiles(isTeacher || !Array.isArray(ownTiles) ? message.tiles : ownTiles);
        } else if (!isTeacher && Array.isArray(message.participants)) {
          const ownTiles = message.participants.find((participant) => participant.name?.trim().toLowerCase() === studentName.trim().toLowerCase())?.tiles;
          if (Array.isArray(ownTiles)) setTiles(ownTiles);
        }
      });

      socket.addEventListener('close', () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimerRef.current = window.setTimeout(connect, 1000);
      });
      socket.addEventListener('error', () => {
        if (!cancelled) setConnected(false);
      });
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) socket.close();
    };
  }, [isTeacher, studentName]);

  useEffect(() => {
    if (!isTeacher || !connected) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({
      type: 'teacher_lesson',
      lesson: { activityId: selectedActivityId, questionId: selectedQuestion.id },
      tiles: createInitialTiles(selectedQuestion)
    }));
    setTiles(createInitialTiles(selectedQuestion));
  }, [connected, isTeacher, selectedActivityId, selectedQuestion]);

  const selectQuestion = (nextQuestionId) => {
    const nextQuestion = questions.find((item) => item.id === nextQuestionId);
    if (!nextQuestion) return;
    setSelectedQuestionId(nextQuestionId);
    setTiles(createInitialTiles(nextQuestion));
  };

  const updateTiles = (nextTiles) => {
    setTiles(nextTiles);
    const socket = socketRef.current;
    if (!isTeacher && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'tiles_update', tiles: nextTiles }));
  };

  const updatePlacements = (nextPlacements) => {
    setPlacements(nextPlacements);
    const socket = socketRef.current;
    if (!isTeacher && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'placements_update', placements: nextPlacements }));
  };

  const selectActivity = (nextActivityId) => {
    const nextId = String(nextActivityId);
    setSelectedActivityId(nextId);
    setPlacements({});
    const nextTileActivity = activityData.activities.find((entry) => String(entry.id) === nextId);
    if (nextTileActivity?.questions?.length) {
      setSelectedQuestionId(nextTileActivity.questions[0].id);
      setTiles(createInitialTiles(nextTileActivity.questions[0]));
    }
  };

  return (
    <>
      <HeroTitle
        title={`${activityData.workshop.title} - ${activePlacementActivity?.code || activeTileActivity.code} ${activePlacementActivity?.title || activeTileActivity.title}`}
        subtitle={activePlacementActivity?.objective || activeTileActivity.objective}
      />

      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout
          className={`poly-neural-zone equations-common-zone${equationWidget ? ' has-equation-widget' : ''}`}
          leftPanel={equationWidget ? <WidgetRenderer widgets={[{
            ...equationWidget,
            position: equationWidget.region,
            settings: { ...(equationWidget.settings || {}), expression: selectedQuestion.label }
          }]} position="left" /> : null}
          rightPanel={null}
          centerPanel={(
            <div className="lab-card lab-card--panel poly-team-card equations-workspace">
              {isPlacementActivity ? <PlacementBoard
                {...activePlacementData}
                placements={placements}
                onChange={updatePlacements}
                activity={`equations:${selectedActivityId}`}
              /> : <AlgebraTiles
                activity={`equations:${selectedQuestion.id}`}
                mode={tileWidget.mode || tileWidget.layout}
                variables={tileWidget.variables || tileWidget.settings?.variables || ['x', 'y']}
                preserveTilesOnSessionStart={Boolean(tileWidget.preserveTilesOnSessionStart)}
                tiles={tiles}
                onTilesChange={updateTiles}
                showSelectionHint={false}
              />}
            </div>
          )}
        />
      </section>

      {isTeacher ? (
        <>
          <ActivitiesAccordion
            preserveSession
            options={activityData.activities.map((entry) => ({ value: entry.id, label: `${entry.code} ${entry.title}` }))}
            value={selectedActivityId}
            onChange={selectActivity}
          />
          {!isPlacementActivity ? <DataAccordion
            title={t('questions')}
            label={t('chooseQuestion')}
            icon="🧮"
            value={selectedQuestion.id}
            options={questions.map((question) => ({ value: question.id, label: question.label }))}
            onChange={selectQuestion}
            preserveSession
            selectId="equations-question"
          /> : null}
          <GroupsAccordion
            participants={participants.filter((participant) => participant.isConnected !== false)}
            columns={isPlacementActivity ? createPlacementGroupColumns(
              activePlacementData.groups,
              activePlacementData.items,
              (participant, item) => participant.placements?.[item.id]
            ) : [
              { key: 'tiles-left', label: labels.resourceTable.leftRegion, render: (participant) => formatTileRegion(participant.tiles, 'left') || labels.resourceTable.emptyValue },
              { key: 'tiles-right', label: labels.resourceTable.rightRegion, render: (participant) => formatTileRegion(participant.tiles, 'right') || labels.resourceTable.emptyValue },
              ...(selectedQuestion.tileScoring ? [{ key: 'score', label: t('score'), render: (participant) => getAlgebraTileRegionScore(participant.tiles, tileWidget.mode || tileWidget.layout, selectedQuestion.tileScoring).score }] : [])
            ]}
            emptyMessage={t('noStudents')}
          />
        </>
      ) : null}

      {!isPlacementActivity && selectedQuestion.tileScoring ? <GroupsAccordion
        role={role}
        studentName={studentName}
        activity={`equations:${selectedQuestion.id}`}
        currentScore={currentScore}
      /> : null}
    </>
  );
}

