import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import FullScreenButton from '../../shared/components/primitives/FullScreenButton';
import {
  Accordion,
  ActivitiesMenu,
  StudentTable,
  StudentScoresAccordion,
  SettingsAccordion,
  CommonSessionSettings,
  HeroTitle,
  MathFormula,
  readIdentityName,
  SharedCommonZoneLayout,
  SharedInputBox,
  SharedInputRow
} from '../../shared/components';
import { useSessionInputLogger } from '../../shared/components/activities/SessionLogContext';
import { ACTIVITY_LIBRARY } from './data/activities';
import './App.css';

function toNumber(value) {
  const normalized = String(value || '').trim().replace(',', '.');
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function App({ role = 'student' }) {
  const { t } = useTranslation('identities');
  const isTeacher = role === 'teacher';
  const sessionLogging = useSessionInputLogger();
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const studentNameRef = useRef(studentName);
  const [selectedActivityId, setSelectedActivityId] = useState(ACTIVITY_LIBRARY[0].id);
  const [answersByActivity, setAnswersByActivity] = useState({});
  const [numericInputs, setNumericInputs] = useState({ a: '', b: '' });
  const [students, setStudents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [scoreRecords, setScoreRecords] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const syncIdentity = (event) => {
      setStudentName(String(event.detail?.name || readIdentityName('Student')).trim());
    };
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    studentNameRef.current = studentName;
  }, [studentName]);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/identities-lab`);
      wsRef.current = socket;

      socket.addEventListener('open', () => {
        if (cancelled) return;
        setIsSocketConnected(true);
        socket.send(JSON.stringify({
          type: isTeacher ? 'register_teacher' : 'register_student',
          name: studentNameRef.current
        }));
        socket.send(JSON.stringify({ type: 'request_state' }));
      });

      socket.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message?.type === 'identities_state' && Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }
      });

      socket.addEventListener('close', () => {
        if (cancelled) return;
        setIsSocketConnected(false);
        reconnectTimerRef.current = window.setTimeout(connect, 1000);
      });

      socket.addEventListener('error', () => {
        if (!cancelled) setIsSocketConnected(false);
      });
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      const socket = wsRef.current;
      wsRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [isTeacher]);

  useEffect(() => {
    const socket = wsRef.current;
    if (!isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({
      type: isTeacher ? 'register_teacher' : 'register_student',
      name: studentName
    }));
  }, [isSocketConnected, isTeacher, studentName]);

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((activity) => activity.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );

  useEffect(() => {
    if (!isTeacher) return undefined;
    let cancelled = false;
    const loadStudents = async () => {
      try {
        const response = await fetch('/api/session-logs/active/identities-lab/students', { cache: 'no-store' });
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) setStudents(Array.isArray(payload?.students) ? payload.students : []);
      } catch {
        if (!cancelled) setStudents([]);
      }
    };
    loadStudents();
    const intervalId = window.setInterval(loadStudents, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isTeacher]);

  useEffect(() => {
    if (!isTeacher || !sessionLogging?.scoreVisible) {
      setScoreRecords([]);
      return undefined;
    }
    let cancelled = false;
    const refreshScores = async () => {
      try {
        const response = await fetch('/api/scores');
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled) setScoreRecords(Array.isArray(payload.students) ? payload.students : []);
      } catch {
        // Keep the most recently loaded scores if refresh fails.
      }
    };
    refreshScores();
    const intervalId = window.setInterval(refreshScores, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isTeacher, sessionLogging?.scoreVisible]);

  const activeAnswers = answersByActivity[selectedActivityId] || { term1: '', term2: '', term3: '' };
  const isProofMode = selectedActivityId === '4';
  const sortedStudents = useMemo(
    () => {
      const sessionStudentsByName = new Map(students.map((student) => [String(student.name || '').trim().toLocaleLowerCase(), student]));
      return participants
        .filter((student) => student?.isConnected !== false)
        .map((participant) => {
          const sessionStudent = sessionStudentsByName.get(String(participant.name || '').trim().toLocaleLowerCase());
          return {
            ...sessionStudent,
            ...participant,
            activityId: sessionStudent?.activityId || '',
            answers: sessionStudent?.answers || {}
          };
        })
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
    },
    [participants, students]
  );

  const leftPanel = (
    <div className="lab-card lab-card--highlight poly-expression-card identities-expression-card" aria-label={t('identityAriaLabel')}>
      <p className="lab-mini-label poly-mini-label">{t('identityLabel')}</p>
      <div className="lab-math-box poly-expression-math">
        <MathFormula
          formula={
            isProofMode
              ? '\\((a+b)^2,\\ (a-b)^2,\\ (a+b)(a-b)\\)'
              : `\\(${activeActivity.expression}\\)`
          }
        />
      </div>
      <p className="identities-note">{t(activeActivity.geometricKey)}</p>
    </div>
  );

  const resultRows = [
    { label: t('term1'), value: activeAnswers.term1, key: 'term1' },
    { label: t('term2'), value: activeAnswers.term2, key: 'term2' },
    { label: t('term3'), value: activeAnswers.term3, key: 'term3' }
  ];

  const aValue = toNumber(numericInputs.a);
  const bValue = toNumber(numericInputs.b);

  const numericProof = useMemo(() => {
    if (aValue === null || bValue === null) {
      return null;
    }

    const sumSquareLeft = (aValue + bValue) ** 2;
    const sumSquareRight = (aValue ** 2) + (2 * aValue * bValue) + (bValue ** 2);

    const diffSquareLeft = (aValue - bValue) ** 2;
    const diffSquareRight = (aValue ** 2) - (2 * aValue * bValue) + (bValue ** 2);

    const squaresDiffLeft = (aValue + bValue) * (aValue - bValue);
    const squaresDiffRight = (aValue ** 2) - (bValue ** 2);

    return {
      sumSquareLeft,
      sumSquareRight,
      diffSquareLeft,
      diffSquareRight,
      squaresDiffLeft,
      squaresDiffRight
    };
  }, [aValue, bValue]);

  const centerPanel = (
    <div className="lab-card lab-card--panel poly-team-card identities-team-card">
      {!isProofMode ? (
        <div className="poly-template-answer-panel">
          <p className="identities-note">{t('completeRightSide')}</p>
          <div className="poly-team-grid poly-team-grid--full">
            <div className="poly-term-block poly-term-block--result">
              <div className="poly-term-inputs poly-term-inputs--result">
                <SharedInputRow
                  activity={`identities:${selectedActivityId}`}
                  rowLabel="R"
                  tokens={['+', '+', '']}
                  defaultPlaceholder=""
                  boxes={resultRows.map((row) => ({
                    id: row.key,
                    key: row.key,
                    label: row.label,
                    value: row.value,
                    onChange: (event) => {
                      const nextValue = event.target.value;
                      setAnswersByActivity((current) => ({
                        ...current,
                        [selectedActivityId]: {
                          ...(current[selectedActivityId] || { term1: '', term2: '', term3: '' }),
                          [row.key]: nextValue
                        }
                      }));
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="poly-template-answer-panel">
          <p className="identities-note">{t('checkEquality')}</p>
          <div className="identities-proof-inputs">
            <SharedInputBox
              id="a"
              activity={`identities:${selectedActivityId}`}
              label="a"
              value={numericInputs.a}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, a: event.target.value }))}
              placeholder=""
            />
            <SharedInputBox
              id="b"
              activity={`identities:${selectedActivityId}`}
              label="b"
              value={numericInputs.b}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, b: event.target.value }))}
              placeholder=""
            />
          </div>

          <div className="lab-preview poly-preview-panel">
            <p className="lab-mini-label poly-mini-label">{t('numericVerification')}</p>
            {numericProof ? (
              <div className="identities-proof-results">
                <p>(a+b)^2 = {numericProof.sumSquareLeft} | a^2+2ab+b^2 = {numericProof.sumSquareRight}</p>
                <p>(a-b)^2 = {numericProof.diffSquareLeft} | a^2-2ab+b^2 = {numericProof.diffSquareRight}</p>
                <p>(a+b)(a-b) = {numericProof.squaresDiffLeft} | a^2-b^2 = {numericProof.squaresDiffRight}</p>
              </div>
            ) : (
              <p className="identities-note">{t('enterBothNumbers')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <aside className="lab-card lab-card--panel poly-team-card identities-geometry-card">
      <p className="lab-mini-label poly-mini-label">{t('geometricProof')}</p>
      <div className="identities-geometry-figure" aria-label={t('geometricProofAriaLabel')}>
        <div className="identities-square identities-square--a2">a²</div>
        <div className="identities-rect identities-rect--ab-1">ab</div>
        <div className="identities-rect identities-rect--ab-2">ab</div>
        <div className="identities-square identities-square--b2">b²</div>
      </div>
      <p className="identities-note">{t('geometricExplanation')}</p>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a+b)^2=a^2+2ab+b^2\\)" />
      </div>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a-b)^2=a^2-2ab+b^2\\)" />
      </div>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a+b)(a-b)=a^2-b^2\\)" />
      </div>
    </aside>
  );

  return (
    <div className="linear-lab-shell identities-lab-shell">
      <header className="linear-lab-header">
        <HeroTitle
          title={`${activeActivity.code} ${t(activeActivity.titleKey)}`}
          subtitle={t(activeActivity.objectiveKey)}
        />
      </header>

      <section className="common-zone lab-zone linear-common-zone">
        <FullScreenButton />
        <div className="linear-topbar">
          <span className="poly-status-pill">{isTeacher ? t('teacherMode') : t('studentMode')}</span>
        </div>

        <SharedCommonZoneLayout
          className="linear-neural-zone identities-neural-zone"
          leftPanel={leftPanel}
          centerPanel={centerPanel}
          rightPanel={rightPanel}
        />
      </section>

      {isTeacher ? (
        <>
          <ActivitiesMenu
            title={t('activities')}
            icon="🎯"
            label={t('chooseActivity')}
            options={ACTIVITY_LIBRARY.map((activity) => ({
              value: activity.id,
              label: `${activity.code} ${t(activity.titleKey)}`
            }))}
            value={selectedActivityId}
            onChange={(nextId) => {
              setSelectedActivityId(nextId);
            }}
          />

          <SettingsAccordion>
            <CommonSessionSettings />
          </SettingsAccordion>

          <StudentTable
            title={t('studentTableTitle', { defaultValue: 'Πίνακας μαθητών' })}
            participants={sortedStudents}
            columns={[
              { key: 'activity', label: t('activities'), render: (student) => student.activityId || '—' },
              { key: 'term1', label: t('term1'), render: (student) => student.answers?.[student.activityId]?.term1 || '—' },
              { key: 'term2', label: t('term2'), render: (student) => student.answers?.[student.activityId]?.term2 || '—' },
              { key: 'term3', label: t('term3'), render: (student) => student.answers?.[student.activityId]?.term3 || '—' },
              { key: 'a', label: 'a', render: (student) => student.answers?.[student.activityId]?.a || '—' },
              { key: 'b', label: 'b', render: (student) => student.answers?.[student.activityId]?.b || '—' },
              ...(sessionLogging?.scoreVisible ? [{
                key: 'score',
                label: t('score', { ns: 'scores' }),
                render: (student) => {
                  const studentNameKey = String(student.name || '').trim().toLocaleLowerCase();
                  const scoreRecord = scoreRecords.find((record) => String(record.name || '').trim().toLocaleLowerCase() === studentNameKey);
                  const score = scoreRecord?.activities?.[`identities:${student.activityId}`];
                  return Number.isFinite(Number(score)) ? Number(Number(score).toFixed(2)) : '—';
                }
              }] : [])
            ]}
            emptyMessage={t('noStudents', { defaultValue: 'Δεν υπάρχουν ακόμη μαθητές.' })}
          />

        </>
      ) : null}
      <StudentScoresAccordion
        role={role}
        studentName={studentName}
        activity={`identities:${selectedActivityId}`}
        currentScore={activeActivity.expected?.reduce((score, expected, index) => {
          const answer = String(activeAnswers[`term${index + 1}`] ?? '').trim();
          if (!answer) return score;
          const normalizedAnswer = answer.replace(/\s+/g, '');
          const normalizedExpected = String(expected ?? '').trim().replace(/\s+/g, '');
          return score + (normalizedAnswer === normalizedExpected ? 1 : -0.5);
        }, 0) ?? 0}
      />
    </div>
  );
}

