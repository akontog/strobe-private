import React, { useEffect, useRef, useState } from 'react';
import { readIdentitySnapshot } from '../menu/identityStorage';
import './CollaborativeGeoGebra.css';

const GEO_SCRIPT_URL = 'https://www.geogebra.org/apps/deployggb.js';

function loadScriptOnce(selector, src, dataName) {
  if (selector()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-tool=\"${dataName}\"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${dataName}.`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.tool = dataName;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${dataName}.`));
    document.body.appendChild(script);
  });
}

function loadRealtimeSocket() {
  return loadScriptOnce(() => typeof window.createRealtimeSocket === 'function', '/js/realtime-socket.js', 'realtime-socket');
}

function loadGeoGebraScript() {
  return loadScriptOnce(() => typeof window.GGBApplet === 'function', GEO_SCRIPT_URL, 'geogebra-deploy');
}

function stripClientOnlyXml(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') {
    return '';
  }

  return xmlText
    .replace(/\sfixed="[^"]*"/g, '')
    .replace(/\sselectionAllowed="[^"]*"/g, '');
}

function getObjectXml(api, name) {
  if (!api || !name) {
    return '';
  }

  if (typeof api.getXML === 'function') {
    const xml = api.getXML(name);
    if (typeof xml === 'string' && xml.trim()) {
      return stripClientOnlyXml(xml);
    }
  }

  return '';
}

function getObjectCmd(api, name) {
  if (!api || !name) {
    return '';
  }

  if (typeof api.getCommandString === 'function') {
    const value = api.getCommandString(name, false);
    if (typeof value === 'string') {
      return value;
    }
  }

  if (typeof api.getDefinitionString === 'function') {
    const value = api.getDefinitionString(name);
    if (typeof value === 'string' && value.trim()) {
      return `${name}=${value}`;
    }
  }

  return '';
}

function getObjectNumericValue(api, name) {
  if (!api || !name || typeof api.getValue !== 'function') {
    return null;
  }

  const raw = api.getValue(name);
  return Number.isFinite(raw) ? raw : null;
}

function getObjectCoords(api, name) {
  if (!api || !name) {
    return { x: null, y: null };
  }

  if (typeof api.getXcoord !== 'function' || typeof api.getYcoord !== 'function') {
    return { x: null, y: null };
  }

  let x = null;
  let y = null;
  try {
    x = api.getXcoord(name);
    y = api.getYcoord(name);
  } catch {
    return { x: null, y: null };
  }

  return {
    x: Number.isFinite(x) ? x : null,
    y: Number.isFinite(y) ? y : null
  };
}

function objectExists(api, name) {
  if (!api || !name) {
    return false;
  }

  if (typeof api.exists === 'function') {
    return Boolean(api.exists(name));
  }

  if (typeof api.getAllObjectNames === 'function') {
    const names = api.getAllObjectNames();
    return Array.isArray(names) && names.includes(name);
  }

  return false;
}

export default function CollaborativeGeoGebra({
  roomId = 'geogebra-default', // Shared GeoGebra room identifier.
  sessionApp = 'geogebra-collab', // App identifier used for session permissions.
  className = '', // Additional CSS classes for the board.
  showStatus = false, // Shows the connection status indicator.
  editable = true, // Allows local construction changes.
  showToolBar = true, // Shows GeoGebra's toolbar.
  showAlgebraView = true, // Shows GeoGebra's algebra panel.
  showAlgebraInput = true, // Shows GeoGebra's algebra input.
  showMenuBar = false, // Shows GeoGebra's menu bar.
  showResetIcon = false, // Shows GeoGebra's reset control.
  showZoomButtons = false, // Shows GeoGebra's zoom controls.
  showFullscreenButton = false, // Shows GeoGebra's fullscreen control.
  showSuggestionButtons = false, // Shows GeoGebra's suggestion controls.
  onConnectionChange, // Receives connection status changes.
  onObjectsChange, // Receives construction object changes.
  onPermissionsChange // Receives permission changes.
}) {
  const boardRef = useRef(null);
  const socketRef = useRef(null);
  const ggbApiRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const updateTimersRef = useRef(new Map());
  const pendingObjectTimersRef = useRef(new Map());
  const pendingRemoteEventsRef = useRef([]);

  const [connected, setConnected] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [studentIdentity, setStudentIdentity] = useState(() => readIdentitySnapshot({
    nameFallback: 'Student',
    colorFallback: '#4ECDC4'
  }));
  const [lockedNames, setLockedNames] = useState([]);

  useEffect(() => {
    function handleIdentityChange() {
      setStudentIdentity(readIdentitySnapshot({
        nameFallback: 'Student',
        colorFallback: '#4ECDC4'
      }));
    }

    window.addEventListener('strobe:identity-change', handleIdentityChange);
    window.addEventListener('storage', handleIdentityChange);

    return () => {
      window.removeEventListener('strobe:identity-change', handleIdentityChange);
      window.removeEventListener('storage', handleIdentityChange);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('geogebra:identity', {
      displayName: studentIdentity.name,
      color: studentIdentity.color
    });
  }, [studentIdentity]);

  useEffect(() => {
    if (editable || !boardRef.current) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement && boardRef.current.contains(activeElement) && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  }, [editable]);

  function emit(event, data) {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit(event, {
      roomId,
      sessionApp,
      ...data
    });
  }

  function withRemoteApply(callback) {
    applyingRemoteRef.current = true;
    try {
      callback();
    } finally {
      applyingRemoteRef.current = false;
    }
  }

  function clearBoard() {
    const api = ggbApiRef.current;
    if (!api || typeof api.getAllObjectNames !== 'function' || typeof api.deleteObject !== 'function') {
      return;
    }

    const names = api.getAllObjectNames();
    if (!Array.isArray(names)) {
      return;
    }

    names.forEach((name) => {
      if (typeof name === 'string' && name.trim()) {
        api.deleteObject(name);
      }
    });
  }

  function applyObjectFromServer(payload, attempt = 0) {
    const api = ggbApiRef.current;
    if (!api || !payload || !payload.name) {
      return;
    }

    const xml = typeof payload.xml === 'string' ? payload.xml : '';
    const cmd = typeof payload.cmd === 'string' ? payload.cmd : '';
    const value = typeof payload.value === 'number' && Number.isFinite(payload.value) ? payload.value : null;
    const x = typeof payload.x === 'number' && Number.isFinite(payload.x) ? payload.x : null;
    const y = typeof payload.y === 'number' && Number.isFinite(payload.y) ? payload.y : null;
    const hasCoords = x !== null && y !== null;

    let applied = false;
    withRemoteApply(() => {
      const exists = objectExists(api, payload.name);
      applied = hasCoords && exists;

      // For moved points, prefer direct coord updates to avoid stale cmd/xml resets to center.
      if (!(hasCoords && exists)) {
        try {
          if (cmd && typeof api.evalCommand === 'function') {
            applied = api.evalCommand(cmd) !== false && objectExists(api, payload.name);
          }
          if (!applied && xml && typeof api.evalXML === 'function') {
            api.evalXML(xml);
            applied = objectExists(api, payload.name);
          }
        } catch {
          applied = objectExists(api, payload.name);
        }
      }

      if (applied && value !== null && typeof api.setValue === 'function') {
        api.setValue(payload.name, value);
      }

      if (applied && hasCoords && typeof api.setCoords === 'function') {
        api.setCoords(payload.name, x, y);
      }
    });

    if (!applied && attempt < 20) {
      const previousTimer = pendingObjectTimersRef.current.get(payload.name);
      if (previousTimer) {
        clearTimeout(previousTimer);
      }
      const timer = setTimeout(() => {
        pendingObjectTimersRef.current.delete(payload.name);
        applyObjectFromServer(payload, attempt + 1);
      }, 100);
      pendingObjectTimersRef.current.set(payload.name, timer);
    } else {
      const timer = pendingObjectTimersRef.current.get(payload.name);
      if (timer) {
        clearTimeout(timer);
        pendingObjectTimersRef.current.delete(payload.name);
      }
    }
  }

  function applyLocks(locked) {
    const api = ggbApiRef.current;
    if (!api || typeof api.getAllObjectNames !== 'function' || typeof api.setFixed !== 'function') {
      return;
    }

    const lockedSet = new Set(Array.isArray(locked) ? locked : []);

    withRemoteApply(() => {
      const names = api.getAllObjectNames();
      if (!Array.isArray(names)) {
        return;
      }

      names.forEach((name) => {
        if (typeof name !== 'string') {
          return;
        }

        const isLocked = lockedSet.has(name);
        api.setFixed(name, isLocked, true);
      });
    });
  }

  function queueUpdate(name) {
    const key = String(name || '').trim();
    if (!key) {
      return;
    }

    const timers = updateTimersRef.current;
    const previous = timers.get(key);
    if (previous) {
      clearTimeout(previous);
    }

    const timer = setTimeout(() => {
      timers.delete(key);
      const api = ggbApiRef.current;
      if (!api || applyingRemoteRef.current) {
        return;
      }

      if (typeof api.isIndependent === 'function' && !api.isIndependent(key)) {
        return;
      }

      emit('geogebra:update', {
        name: key,
        cmd: getObjectCmd(api, key),
        xml: getObjectXml(api, key),
        value: getObjectNumericValue(api, key),
        ...getObjectCoords(api, key)
      });
    }, 70);

    timers.set(key, timer);
  }

  function setupGeoListeners(api) {
    if (!api) {
      return;
    }

    if (typeof api.registerAddListener === 'function') {
      api.registerAddListener((name) => {
        if (applyingRemoteRef.current) {
          return;
        }

        emit('geogebra:add', {
          name,
          cmd: getObjectCmd(api, name),
          xml: getObjectXml(api, name),
          value: getObjectNumericValue(api, name),
          ...getObjectCoords(api, name)
        });
      });
    }

    if (typeof api.registerUpdateListener === 'function') {
      api.registerUpdateListener((name) => {
        if (applyingRemoteRef.current) {
          return;
        }
        queueUpdate(name);
      });
    }

    if (typeof api.registerObjectUpdateListener === 'function') {
      api.registerObjectUpdateListener((name) => {
        if (applyingRemoteRef.current) {
          return;
        }
        queueUpdate(name);
      });
    }

    if (typeof api.registerRemoveListener === 'function') {
      api.registerRemoveListener((name) => {
        if (applyingRemoteRef.current) {
          return;
        }
        emit('geogebra:remove', { name });
      });
    }

    if (typeof api.registerRenameListener === 'function') {
      api.registerRenameListener((oldName, newName) => {
        if (applyingRemoteRef.current) {
          return;
        }
        emit('geogebra:rename', {
          name: oldName,
          to: newName
        });
      });
    }
  }

  function applyRemoteEvent(event, payload) {
    if (!ggbApiRef.current) {
      pendingRemoteEventsRef.current.push({ event, payload });
      return;
    }

    if (event === 'init') {
      pendingObjectTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingObjectTimersRef.current.clear();
      const state = Array.isArray(payload && payload.state) ? payload.state : [];
      withRemoteApply(() => {
        clearBoard();
        state.forEach((entry) => applyObjectFromServer(entry));
      });
      if (typeof onObjectsChange === 'function') {
        onObjectsChange(state);
      }
      return;
    }

    if (event === 'upsert') {
      applyObjectFromServer(payload);
      return;
    }

    if (event === 'remove') {
      const api = ggbApiRef.current;
      const name = payload && payload.name;
      if (!name || typeof api.deleteObject !== 'function') {
        return;
      }
      withRemoteApply(() => api.deleteObject(name));
      return;
    }

    if (event === 'rename') {
      const api = ggbApiRef.current;
      const from = payload && payload.from;
      const to = payload && payload.to;
      if (!from || !to || typeof api.renameObject !== 'function') {
        return;
      }
      withRemoteApply(() => api.renameObject(from, to));
      return;
    }

    if (event === 'permissions') {
      const locked = Array.isArray(payload && payload.locked) ? payload.locked : [];
      const info = payload && payload.info && typeof payload.info === 'object' ? payload.info : {};
      setLockedNames(locked);
      applyLocks(locked);
      if (typeof onPermissionsChange === 'function') {
        onPermissionsChange({ locked, info });
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        await loadRealtimeSocket();
        await loadGeoGebraScript();

        if (cancelled) {
          return;
        }

        const applet = new window.GGBApplet({
          appName: 'geometry',
          width: 1000,
          height: 560,
          showToolBar,
          showAlgebraView,
          showAlgebraInput,
          showMenuBar,
          showResetIcon,
          showZoomButtons,
          showFullscreenButton,
          showSuggestionButtons,
          enableShiftDragZoom: true,
          appletOnLoad(api) {
            ggbApiRef.current = api;
            setupGeoListeners(api);
            const pendingEvents = pendingRemoteEventsRef.current.splice(0);
            pendingEvents.forEach(({ event, payload }) => applyRemoteEvent(event, payload));
          }
        }, true);

        applet.inject(boardRef.current);

        const socket = window.createRealtimeSocket({ path: '/ws/realtime' });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          setErrorText('');
          socket.emit('geogebra:join', {
            roomId,
            sessionApp,
            displayName: studentIdentity.name,
            color: studentIdentity.color
          });
          if (typeof onConnectionChange === 'function') {
            onConnectionChange(true);
          }
        });

        socket.on('disconnect', () => {
          setConnected(false);
          if (typeof onConnectionChange === 'function') {
            onConnectionChange(false);
          }
        });

        socket.on('connect_error', () => {
          setErrorText('Realtime connection failed.');
        });

        socket.on('geogebra:error', (payload) => {
          setErrorText((payload && payload.message) || 'GeoGebra sync rejected by server.');
        });

        socket.on('geogebra:init', (payload) => applyRemoteEvent('init', payload));
        socket.on('geogebra:upsert', (payload) => applyRemoteEvent('upsert', payload));
        socket.on('geogebra:remove', (payload) => applyRemoteEvent('remove', payload));
        socket.on('geogebra:rename', (payload) => applyRemoteEvent('rename', payload));
        socket.on('geogebra:permissions', (payload) => applyRemoteEvent('permissions', payload));

        socket.connect();
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : 'GeoGebra setup failed.');
      }
    }

    setup();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.disconnect();
      }

      updateTimersRef.current.forEach((timer) => clearTimeout(timer));
      updateTimersRef.current.clear();
      pendingObjectTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingObjectTimersRef.current.clear();
      pendingRemoteEventsRef.current = [];
    };
  }, [
    roomId,
    sessionApp,
    onConnectionChange,
    onObjectsChange,
    onPermissionsChange,
    showToolBar,
    showAlgebraView,
    showAlgebraInput,
    showMenuBar,
    showResetIcon,
    showZoomButtons,
    showFullscreenButton,
    showSuggestionButtons
  ]);

  return (
    <section className={`gg-collab ${className}`.trim()}>
      {showStatus ? (
        <div className="gg-collab__status">
          <span className={`gg-collab__chip ${connected ? 'is-online' : ''}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="gg-collab__chip">Room: {roomId}</span>
          <span className="gg-collab__chip">Identity: {studentIdentity.name || '-'}</span>
          <span className="gg-collab__chip">Locked objects: {lockedNames.length}</span>
        </div>
      ) : null}

      {errorText ? <p className="gg-collab__error">{errorText}</p> : null}

      <div className={`gg-collab__board-shell${editable ? '' : ' is-locked'}`} aria-disabled={!editable}>
        <div ref={boardRef} className="gg-collab__board" inert={!editable ? '' : undefined} />
        {!editable ? <div className="gg-collab__lock-overlay" aria-hidden="true" /> : null}
      </div>

    </section>
  );
}
