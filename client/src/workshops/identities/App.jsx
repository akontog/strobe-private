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
  GroupingDragDrop,
  AlgebraTiles,
  readIdentityName,
  SharedCommonZoneLayout,
  InputGrid
} from '../../shared/components';
import { useSessionInputLogger } from '../../shared/components/activities/SessionLogContext';
import activityData from './data/activities.json';
import './App.css';

const { activities: ACTIVITY_LIBRARY } = activityData;

function computeActivityScore(activity, answers) {
  const correctAnswers = activity?.terms
    ? activity.terms.map((term) => term.correctAnswers || {})
    : activity?.correctAnswers || {};
  const pointsForCorrect = activity?.scoreCorrect ?? 1;
  const pointsForIncorrect = activity?.scoreIncorrect ?? -0.5;
  const normalize = (value) => String(value ?? '').replace(/\s+/g, '').toLowerCase();

  if (activity?.resultMode === 'identityMatching') {
    return Object.entries(correctAnswers).reduce((score, [itemId, expectedGroupId]) => {
      const groupId = answers?.[itemId];
      if (!groupId) return score;
      return score + (groupId === expectedGroupId ? pointsForCorrect : pointsForIncorrect);
    }, 0);
  }

  const expectedAnswers = Array.isArray(correctAnswers)
    ? correctAnswers.flatMap((term, index) => Object.entries(term).map(([field, value]) => [`part-${index}-${field}`, value]))
    : Object.entries(correctAnswers);

  return expectedAnswers.reduce((score, [key, expected]) => {
    const answer = String(answers?.[key] ?? '').trim();
    if (!answer) return score;
    return score + (normalize(answer) === normalize(expected) ? pointsForCorrect : pointsForIncorrect);
  }, 0);
}

export default function App({ role = 'student' }) {
  const { t } = useTranslation('identities');
  const { t: tNav } = useTranslation('navigation');
  const isTeacher = role === 'teacher';
  const sessionLogging = useSessionInputLogger();
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const studentNameRef = useRef(studentName);
  const [selectedActivityId, setSelectedActivityId] = useState(ACTIVITY_LIBRARY[0].id);
  const [selectedIdentityVariantId, setSelectedIdentityVariantId] = useState(ACTIVITY_LIBRARY[0].variants[0].id);
  const [answersByActivity, setAnswersByActivity] = useState({});
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
          if (!isTeacher && message.lesson && typeof message.lesson === 'object') {
            const nextActivity = ACTIVITY_LIBRARY.find((activity) => activity.id === message.lesson.activityId);
            if (nextActivity) {
              setSelectedActivityId(nextActivity.id);
              const nextVariant = nextActivity.variants?.find((variant) => variant.id === message.lesson.variantId);
              if (nextVariant) setSelectedIdentityVariantId(nextVariant.id);
              else if (nextActivity.variants?.[0]) setSelectedIdentityVariantId(nextActivity.variants[0].id);
            }
          }
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

  useEffect(() => {
    const socket = wsRef.current;
    if (!isTeacher || !isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) return;
    const activity = ACTIVITY_LIBRARY.find((item) => item.id === selectedActivityId) || ACTIVITY_LIBRARY[0];
    const variant = activity.variants?.find((item) => item.id === selectedIdentityVariantId) || activity.variants?.[0];
    socket.send(JSON.stringify({
      type: 'teacher_lesson',
      lesson: { activityId: activity.id, variantId: variant?.id || '' }
    }));
  }, [isSocketConnected, isTeacher, selectedActivityId, selectedIdentityVariantId]);

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((activity) => activity.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );
  const activeIdentityVariant = activeActivity.variants?.find((variant) => variant.id === selectedIdentityVariantId)
    || activeActivity.variants?.[0];

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

  const activityWidgets = Array.isArray(activeActivity.widgets) ? activeActivity.widgets : [];
  const expressionWidget = activityWidgets.find((widget) => widget.type === 'identity-expression' && widget.region === 'left');
  const centerWidget = activityWidgets.find((widget) => widget.region === 'center');
  const isPolynomialActivity = centerWidget?.type === 'identity-polynomial';
  const isGroupingActivity = centerWidget?.type === 'grouping-drag-drop';
  const isAlgebraTilesActivity = centerWidget?.type === 'algebra-tiles';
  const activeExercise = activeActivity.variants ? activeIdentityVariant : activeActivity;
  const answerActivityKey = activeActivity.variants
    ? `${selectedActivityId}:${activeIdentityVariant.id}`
    : selectedActivityId;
  const activeAnswers = answersByActivity[answerActivityKey] || { term1: '', term2: '', term3: '' };
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

  const leftPanel = expressionWidget ? (
    <div className={`${expressionWidget.card ? 'lab-card lab-card--highlight ' : ''}poly-expression-card identities-expression-card`} aria-label={t('identityAriaLabel')}>
        <div className="lab-math-box poly-expression-math">
          <MathFormula formula={`\\(${activeExercise.expression}\\)`} />
        </div>
    </div>
  ) : null;

  const updateAnswer = (key, value) => {
    setAnswersByActivity((current) => ({
      ...current,
      [answerActivityKey]: {
        ...(current[answerActivityKey] || { term1: '', term2: '', term3: '' }),
        [key]: value
      }
    }));
  };

  const identityCorrectTerms = Array.isArray(activeExercise?.terms) ? activeExercise.terms : [];
  const identityPolynomialPreview = identityCorrectTerms.map((_, index) => {
    const term = identityCorrectTerms[index];
    const coefficientValue = String(activeAnswers[`part-${index}-coefficient`] ?? '').trim();
    const coefficient = coefficientValue === '' ? null : Number(coefficientValue);

    const variables = term.variables.map((variable) => {
      const exponentValue = String(activeAnswers[`part-${index}-degree${variable.key.toUpperCase()}`] ?? '').trim();
      if (exponentValue === '') return `${variable.symbol}^{\\square}`;
      const exponent = Number(exponentValue);
      if (!Number.isFinite(exponent)) return `${variable.symbol}^{\\square}`;
      return exponent === 0 ? '' : `${variable.symbol}${exponent === 1 ? '' : `^{${exponent}}`}`;
    }).join('');
    const hasValidCoefficient = coefficient !== null && Number.isFinite(coefficient);
    const absoluteCoefficient = hasValidCoefficient ? Math.abs(coefficient) : null;
    const coefficientText = !hasValidCoefficient
      ? (coefficientValue || '\\square')
      : variables && absoluteCoefficient === 1
        ? ''
        : String(absoluteCoefficient);
    const body = hasValidCoefficient && coefficient === 0 ? '0' : `${coefficientText}${variables}` || '0';
    return { coefficient, body };
  });
  const identityPolynomialText = identityPolynomialPreview.reduce((result, term, index) => {
    if (index === 0) return term.coefficient < 0 ? `-${term.body}` : term.body;
    return `${result} ${term.coefficient < 0 ? '-' : '+'} ${term.body}`;
  }, '');

  const centerContent = (
    <>
      {isPolynomialActivity ? (
        <div className="poly-template-answer-panel">
          <p className="identities-note">{t('completeRightSide')}</p>
          <InputGrid
            activity={`identities:${answerActivityKey}`}
            columns={3}
            className="lab-input-grid identities-polynomial-answer-grid"
            customLayout
            labelClassName="activity-input-grid__label"
            fields={identityCorrectTerms.flatMap((term, index) => ([
              (() => {
                const termPattern = `\\square ${term.variables.map((variable) => `${variable.symbol}^{\\square}`).join(' ')}`;
                return {
                  id: `part-${index}-coefficient`,
                  label: <>{t('coefficientOfTerm')} <MathFormula formula={`\\(${termPattern}\\)`} /></>,
                  ariaLabel: `${t('coefficientOfTerm')} ${term.variables.map((variable) => variable.label).join('')}`,
                  value: activeAnswers[`part-${index}-coefficient`] || '',
                  onChange: (value) => updateAnswer(`part-${index}-coefficient`, value)
                };
              })(),
              ...term.variables.map((variable) => {
                const key = `part-${index}-degree${variable.key.toUpperCase()}`;
                const termPattern = `\\square ${term.variables.map((symbol) => `${symbol.symbol}^{\\square}`).join(' ')}`;
                return {
                  id: key,
                  label: <>{t('exponentOf')} <MathFormula formula={`\\(${variable.symbol}\\)`} /> {t('inTerm')} <MathFormula formula={`\\(${termPattern}\\)`} /></>,
                  ariaLabel: `${t('exponentOf')} ${variable.label} ${t('inTerm')} ${term.variables.map((symbol) => symbol.label).join('')}`,
                  value: activeAnswers[key] || '',
                  onChange: (value) => updateAnswer(key, value)
                };
              })
            ]))}
          />
          <div className="lab-preview poly-preview-panel">
            <p className="lab-mini-label poly-mini-label">{t('answer')}</p>
            <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
              <MathFormula formula={`\\(${identityPolynomialText}\\)`} />
            </div>
          </div>
        </div>
      ) : isAlgebraTilesActivity ? (
        <AlgebraTiles
          activity={`identities:${answerActivityKey}`}
          layout={centerWidget.layout}
          tiles={activeAnswers.tiles || []}
          onTilesChange={(tiles) => updateAnswer('tiles', tiles)}
        />
      ) : (
        <div className="identities-matching-panel">
          <p className="identities-note">{t(centerWidget.instructionKey)}</p>
          <GroupingDragDrop
            activity={`identities:${selectedActivityId}`}
            items={activeActivity.items.map((item) => ({
              id: item.id,
              content: <MathFormula formula={`\\(${item.formula}\\)`} />
            }))}
            groups={activeActivity.groups.map((group) => ({
              id: group.id,
              title: <MathFormula formula={`\\(${group.formula}\\)`} />
            }))}
            placements={activeAnswers}
            onChange={(placements) => {
              setAnswersByActivity((current) => ({ ...current, [answerActivityKey]: placements }));
            }}
            bankLabel={t(centerWidget.bankLabelKey)}
          />
        </div>
      )}
    </>
  );
  const centerPanel = centerWidget?.card
    ? <div className="lab-card lab-card--panel poly-team-card identities-team-card">{centerContent}</div>
    : centerContent;

  return (
    <>
      <HeroTitle
        title={`${tNav('items.identities')} - ${activeActivity.code} ${t(activeActivity.titleKey)}`}
        subtitle={t(activeExercise.objectiveKey || activeActivity.objectiveKey)}
      />

      <section className="common-zone lab-zone">
        <FullScreenButton />
       

        <SharedCommonZoneLayout
          className={`linear-neural-zone identities-neural-zone${isPolynomialActivity || isGroupingActivity ? ' identities-answer-activity-zone' : ''}`}
          leftPanel={leftPanel}
          centerPanel={centerPanel}
          rightPanel={null}
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
        activity={`identities:${answerActivityKey}`}
        currentScore={computeActivityScore(isGroupingActivity ? activeActivity : activeExercise, activeAnswers)}
      />
      {isTeacher && activeActivity.variants ? (
        <ActivitiesMenu
          title={t('identityVariantTitle')}
          icon="🧮"
          label={t('chooseIdentityVariant')}
          options={activeActivity.variants.map((variant) => ({ value: variant.id, label: variant.label }))}
          value={activeIdentityVariant.id}
          onChange={setSelectedIdentityVariantId}
        />
      ) : null}
    </>
  );
}

