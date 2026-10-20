import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import AlgebraTiles from './AlgebraTiles';
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
  role = 'student' // Allows the teacher to configure the shared board mode.
}) {
  const { t } = useTranslation('interface');
  const socketRef = useRef(null);
  const [mode, setMode] = useState(configuredMode);
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
      });
      socket.on('algebra-tiles:state', (state) => {
        if (state?.roomId !== `algebra-tiles-${roomId}`) return;
        setMode(state.mode || 'simplified');
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

  return (
    <div className="collaborative-algebra-tiles">
      {selectedExercise ? (
        <p className="collaborative-algebra-tiles__prompt">
          {category === 'factorization' ? `${t('algebraTiles.factorize')}: ` : ''}{selectedExercise.prompt}
        </p>
      ) : null}
      <AlgebraTiles activity={activity} variables={variables} mode={mode} tiles={tiles} onTilesChange={updateTiles} />
      {role === 'teacher' ? (
        <Accordion title={t('algebraTiles.settings')} className="collaborative-algebra-tiles__settings">
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
        </Accordion>
      ) : null}
    </div>
  );
}
