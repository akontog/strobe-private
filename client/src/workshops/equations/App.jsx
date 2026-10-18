import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import {
  ActivitiesMenu,
  AlgebraTiles,
  CommonSessionSettings,
  FullScreenButton,
  HeroTitle,
  InputGrid,
  SettingsAccordion,
  SharedCommonZoneLayout,
  StudentScoresAccordion,
  StudentTable,
  readIdentityName
} from '../../shared/components';
import activityData from './data/activities.json';
import './App.css';

const activity = activityData.activities[0];
const questions = activity.questions;
const tileWidget = activity.widgets.find((widget) => widget.type === 'algebra-tiles');
const TILE_WIDTH_UNITS = { x: 6, one: 2 };

function createInitialTiles(question) {
  let sequence = 0;
  return ['left', 'right'].flatMap((side) => {
    const terms = side === 'left' ? question.leftTerms : question.rightTerms;
    let x = 0;
    let y = 0;
    const maxRowWidth = 14;
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
  const { t } = useTranslation('equations');
  const { t: tNav } = useTranslation('navigation');
  const isTeacher = role === 'teacher';
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const [selectedQuestionId, setSelectedQuestionId] = useState(questions[0].id);
  const [tiles, setTiles] = useState(() => createInitialTiles(questions[0]));
  const [answers, setAnswers] = useState({});
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) || questions[0];
  const currentAnswer = answers[selectedQuestion.id] || '';
  const currentScore = currentAnswer === ''
    ? 0
    : Number(currentAnswer) === Number(selectedQuestion.solution) ? activity.scoreCorrect : activity.scoreIncorrect;

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
            lesson: { activityId: activity.id, questionId: selectedQuestionId },
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
        if (!isTeacher && message.lesson?.questionId) setSelectedQuestionId(message.lesson.questionId);
        if (Array.isArray(message.tiles)) setTiles(message.tiles);
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
      lesson: { activityId: activity.id, questionId: selectedQuestion.id },
      tiles: createInitialTiles(selectedQuestion)
    }));
    setTiles(createInitialTiles(selectedQuestion));
  }, [connected, isTeacher, selectedQuestion]);

  useEffect(() => {
    if (isTeacher || !connected) return;
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'answer_update', questionId: selectedQuestion.id, answer: currentAnswer }));
    }
  }, [connected, currentAnswer, isTeacher, selectedQuestion]);

  const selectQuestion = (nextQuestionId) => {
    const nextQuestion = questions.find((item) => item.id === nextQuestionId);
    if (!nextQuestion) return;
    setSelectedQuestionId(nextQuestionId);
    setTiles(createInitialTiles(nextQuestion));
  };

  const updateTiles = (nextTiles) => {
    setTiles(nextTiles);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'tiles_update', tiles: nextTiles }));
  };

  const updateAnswer = (value) => {
    setAnswers((current) => ({ ...current, [selectedQuestion.id]: value }));
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'answer_update', questionId: selectedQuestion.id, answer: value }));
    }
  };

  return (
    <>
      <HeroTitle
        title={`${tNav('items.equations')} - ${activity.code} ${t(activity.titleKey)}`}
        subtitle={t(activity.objectiveKey)}
      />

      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout
          className="poly-neural-zone equations-common-zone"
          leftPanel={null}
          rightPanel={null}
          centerPanel={(
            <div className="lab-card lab-card--panel poly-team-card equations-workspace">
              <p className="equations-instruction">{t('removeMatchingTiles')}</p>
              <AlgebraTiles
                activity={`equations:${selectedQuestion.id}`}
                layout={tileWidget.layout}
                tiles={tiles}
                onTilesChange={updateTiles}
              />
              <div className="equations-answer-panel">
                <span className="equations-answer-title">{t('solutionPrompt')}</span>
                <InputGrid
                  activity={`equations:${selectedQuestion.id}`}
                  columns={1}
                  fields={[{
                    id: `solution-${selectedQuestion.id}`,
                    label: t('solutionLabel'),
                    value: currentAnswer,
                    onChange: updateAnswer
                  }]}
                />
              </div>
            </div>
          )}
        />
      </section>

      {isTeacher ? (
        <>
          <ActivitiesMenu
            title={t('questions')}
            icon="⚖️"
            label={t('chooseQuestion')}
            preserveSession
            options={questions.map((question) => ({ value: question.id, label: question.label }))}
            value={selectedQuestion.id}
            onChange={selectQuestion}
          />
          <SettingsAccordion>
            <CommonSessionSettings />
          </SettingsAccordion>
          <StudentTable
            title={t('studentTableTitle')}
            participants={participants.filter((participant) => participant.isConnected !== false)}
            columns={[{ key: 'answer', label: t('solutionLabel'), render: (participant) => participant.answer || '—' }]}
            emptyMessage={t('noStudents')}
          />
        </>
      ) : null}

      <StudentScoresAccordion
        role={role}
        studentName={studentName}
        activity={`equations:${selectedQuestion.id}`}
        currentScore={currentScore}
      />
    </>
  );
}
