import React, { useEffect, useRef, useState } from 'react';
import AlgebraTiles from './AlgebraTiles';

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
  mode: configuredMode = 'simplified', // Initial board layout selected in activity settings.
  role = 'student' // Allows the teacher to configure the shared board mode.
}) {
  const socketRef = useRef(null);
  const [mode, setMode] = useState(configuredMode);
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('algebra-tiles:join', { roomId, sessionApp });
        if (role === 'teacher') socket.emit('algebra-tiles:mode', { roomId, sessionApp, mode: configuredMode });
      });
      socket.on('algebra-tiles:state', (state) => {
        if (state?.roomId !== `algebra-tiles-${roomId}`) return;
        setMode(state.mode || 'simplified');
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

  const updateMode = (event) => {
    const nextMode = event.target.value;
    setMode(nextMode);
    socketRef.current?.emit('algebra-tiles:mode', { roomId, sessionApp, mode: nextMode });
  };

  return (
    <div className="collaborative-algebra-tiles">
      {role === 'teacher' ? (
        <label className="collaborative-algebra-tiles__mode">
          Board mode
          <select value={mode} onChange={updateMode}>
            <option value="equation">Equation</option>
            <option value="area">Area</option>
            <option value="simplified">Simplified</option>
          </select>
        </label>
      ) : null}
      <AlgebraTiles activity={activity} variables={variables} mode={mode} tiles={tiles} onTilesChange={updateTiles} />
    </div>
  );
}
