import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import AlgebraTiles from './AlgebraTiles';
import MathJaxText from '../primitives/MathJaxText';
import exercises from '../../data/algebraTilesExercises.json';

function loadRealtimeSocket() {
  if (typeof window.createRealtimeSocket === 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tool="realtime-socket"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = '/js/realtime-socket.js';
    script.dataset.tool = 'realtime-socket';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/** Displays one teacher-configured AlgebraTiles board shared by everyone in the room. */
export default function CollaborativeAlgebraTiles({
  roomId = 'algebra-tiles-default', // Shared board room identifier.
  sessionApp = 'activity-runner', // App identifier used to resolve the participant role.
  variables = ['x', 'y'], // Names shown for the two tile variables.
  activity = '', // Activity identifier used by the input logger.
  mode: configuredMode = 'equation', // Initial board layout selected in activity settings.
  promptMode = 'json', // Uses workshop exercise JSON or a teacher-authored expression.
  role = 'student' // Allows the teacher to configure the shared board mode.
}) {
  const { t } = useTranslation('interface');
  const socketRef = useRef(null);
  const promptExpressionRef = useRef('');
  const promptEditedRef = useRef(false);
  const promptInputId = useId();
  const [mode, setMode] = useState(configuredMode);
  const [promptExpression, setPromptExpression] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [tiles, setTiles] = useState([]);
  const category = mode === 'equation' ? 'equations' : 'factorization';
  const availableExercises = exercises[category];
  const selectedExercise = availableExercises.find((item) => item.id === exerciseId) || availableExercises[0];

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('algebra-tiles:join', { roomId, sessionApp });
        if (role === 'teacher' && promptEditedRef.current) {
          socket.emit('algebra-tiles:prompt', { roomId, sessionApp, promptExpression: promptExpressionRef.current });
        }
      });
      socket.on('algebra-tiles:state', (state) => {
        if (state?.roomId !== `algebra-tiles-${roomId}`) return;
        setMode(state.mode || 'simplified');
        if (role !== 'teacher' || !promptEditedRef.current) {
          const nextPromptExpression = state.promptExpression || '';
          promptExpressionRef.current = nextPromptExpression;
          setPromptExpression(nextPromptExpression);
        }
        setExerciseId(state.exerciseId || '');
        setTiles(Array.isArray(state.tiles) ? state.tiles : []);
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, sessionApp, role, configuredMode]);

  const updateTiles = (nextTiles) => {
    setTiles(nextTiles);
    socketRef.current?.emit('algebra-tiles:update', { roomId, sessionApp, tiles: nextTiles });
  };

  const updateMode = (nextMode) => {
    if (role !== 'teacher') return;
    setMode(nextMode);
    socketRef.current?.emit('algebra-tiles:mode', { roomId, sessionApp, mode: nextMode });
  };

  const updateExercise = (nextCategory, nextExerciseId) => {
    if (role !== 'teacher') return;
    const nextExercise = exercises[nextCategory].find((item) => item.id === nextExerciseId) || exercises[nextCategory][0];
    const nextMode = nextCategory === 'equations' ? 'equation' : 'area';
    setMode(nextMode);
    setExerciseId(nextExercise.id);
    setTiles([]);
    socketRef.current?.emit('algebra-tiles:exercise', {
      roomId,
      sessionApp,
      mode: nextMode,
      exerciseId: nextExercise.id
    });
  };

  const updatePromptExpression = (event) => {
    const nextPromptExpression = event.target.value;
    promptExpressionRef.current = nextPromptExpression;
    promptEditedRef.current = true;
    setPromptExpression(nextPromptExpression);
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('algebra-tiles:prompt', { roomId, sessionApp, promptExpression: nextPromptExpression });
    }
  };

  const normalizedExpression = promptExpression.trim()
    .replace(/^\\\((.*)\\\)$/s, '$1')
    .replace(/^\$([\s\S]*)\$$/, '$1');
  const equationSeparator = mode === 'equation' ? normalizedExpression.indexOf('=') : -1;
  const equationSides = equationSeparator >= 0
    ? {
      left: normalizedExpression.slice(0, equationSeparator).trim(),
      right: normalizedExpression.slice(equationSeparator + 1).trim()
    }
    : null;

  return (
    <div className="collaborative-algebra-tiles">
      {promptMode === 'expression'
        ? (promptExpression.trim() ? <div className="collaborative-algebra-tiles__prompt"><MathJaxText text={promptExpression} /></div> : null)
        : (selectedExercise ? <p className="collaborative-algebra-tiles__prompt">
          {category === 'factorization' ? `${t('algebraTiles.factorize')}: ` : ''}{selectedExercise.prompt}
        </p> : null)}
      <AlgebraTiles activity={activity} variables={variables} mode={mode} tiles={tiles} onTilesChange={updateTiles}
        equationSides={promptMode === 'expression' && equationSides?.left && equationSides?.right ? equationSides : null} />
      {role === 'teacher' ? (
        <Accordion title={t('algebraTiles.settings')} className="collaborative-algebra-tiles__settings">
          {promptMode === 'expression' ? (
            <>
              <div className="collaborative-algebra-tiles__modes" role="group" aria-label={t('algebraTiles.boardMode')}>
                {['equation', 'area', 'simplified'].map((nextMode) => (
                  <button key={nextMode} type="button" className={mode === nextMode ? 'is-active' : ''} aria-pressed={mode === nextMode} onClick={() => updateMode(nextMode)}>
                    {t(`algebraTiles.modes.${nextMode}`)}
                  </button>
                ))}
              </div>
              <label className="collaborative-algebra-tiles__setting">
                {t('algebraTiles.promptExpression')}
                <input
                  id={promptInputId}
                  type="text"
                  value={promptExpression}
                  onChange={updatePromptExpression}
                  placeholder={mode === 'equation' ? '2x + 3 = 7' : 'x^2 + 5x + 6'}
                  maxLength={10000}
                />
              </label>
            </>
          ) : (
            <>
              <label className="collaborative-algebra-tiles__setting">
                {t('algebraTiles.activityType')}
                <select value={category} onChange={(event) => updateExercise(event.target.value, exercises[event.target.value][0].id)}>
                  <option value="equations">{t('algebraTiles.equations')}</option>
                  <option value="factorization">{t('algebraTiles.factorization')}</option>
                </select>
              </label>
              <label className="collaborative-algebra-tiles__setting">
                {t(category === 'equations' ? 'algebraTiles.equation' : 'algebraTiles.factorizationTask')}
                <select value={selectedExercise?.id || ''} onChange={(event) => updateExercise(category, event.target.value)}>
                  {availableExercises.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </>
          )}
        </Accordion>
      ) : null}
    </div>
  );
}
