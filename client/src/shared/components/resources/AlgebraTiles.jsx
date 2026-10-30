import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './AlgebraTiles.css';
import { useTranslation } from 'react-i18next';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import MathJaxText from '../primitives/MathJaxText';
import { Accordion } from '../layouts/Accordion';
import { requestRealtimeAck } from '../../utils/realtimeAck';
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

const TILE_TYPES = [
  { id: 'one', label: '1', name: 'Μονάδα', className: 'unit' },
  { id: 'x', label: 'x', name: 'x', className: 'x' },
  { id: 'y', label: 'y', name: 'y', className: 'y' },
  { id: 'x2', label: 'x²', name: 'x²', className: 'x2' },
  { id: 'xy', label: 'xy', name: 'xy', className: 'xy' },
  { id: 'y2', label: 'y²', name: 'y²', className: 'y2' }
];

function getTileDefinition(type, variables) {
  const definition = TILE_TYPES.find((item) => item.id === type);
  if (!definition) return null;

  const { x, y } = variables;
  const labels = {
    x,
    y,
    x2: `${x}²`,
    xy: `${x}${y}`,
    y2: `${y}²`
  };

  return { ...definition, label: labels[type] || definition.label, name: labels[type] || definition.name };
}

const TILE_SPANS = {
  one: [2, 2],
  x: [6, 2],
  y: [4, 2],
  x2: [6, 6],
  xy: [6, 4],
  y2: [4, 4]
};
const GRID_UNIT = 20;
const T_CHART_AXIS_X = 120;
const T_CHART_AXIS_Y = 80;
const T_CHART_HORIZONTAL_ROW_Y = 40;
const T_CHART_VERTICAL_COLUMN_X = 80;
const SYSTEMS_ROW_HEADER_HEIGHT = 56;

function normalizeMode(mode, layout) {
  const selectedMode = mode || layout;
  if (selectedMode === 'equation' || selectedMode === 'systems' || selectedMode === 'area' || selectedMode === 'simplified') return selectedMode;
  if (selectedMode === 't-chart') return 'area';
  return 'simplified';
}

function isEquationLikeMode(mode) {
  return mode === 'equation' || mode === 'systems';
}

function getSystemsEquationIndex(tile) {
  return Math.max(0, Math.min(1, Number.isInteger(tile?.equationIndex) ? tile.equationIndex : 0));
}

function getSystemsRowTop(boardHeight, equationIndex) {
  return equationIndex * (boardHeight / 2) + SYSTEMS_ROW_HEADER_HEIGHT;
}

function normalizeVariables(variables) {
  const variableList = Array.isArray(variables)
    ? variables
    : [variables?.x, variables?.y];
  return {
    x: String(variableList[0] || 'x'),
    y: String(variableList[1] || 'y')
  };
}

function getTileDimensions(type, orientation) {
  const [spanX, spanY] = getTileSpans(type, orientation);
  return { width: spanX * GRID_UNIT, height: spanY * GRID_UNIT };
}

function formatPolynomial(tiles, variables) {
  const powers = { x2: 0, xy: 0, y2: 0, x: 0, y: 0, one: 0 };
  tiles.forEach((tile) => {
    if (Object.hasOwn(powers, tile.type)) powers[tile.type] += tile.sign < 0 ? -1 : 1;
  });

  const terms = [
    ['x2', `${variables.x}²`], ['xy', `${variables.x}${variables.y}`],
    ['y2', `${variables.y}²`], ['x', variables.x], ['y', variables.y], ['one', '']
  ].filter(([type]) => powers[type] !== 0);
  if (!terms.length) return '0';

  return terms.map(([type, monomial], index) => {
    const coefficient = powers[type];
    const absoluteCoefficient = Math.abs(coefficient);
    const body = `${monomial && absoluteCoefficient === 1 ? '' : absoluteCoefficient}${monomial}` || '1';
    if (index === 0) return coefficient < 0 ? `-${body}` : body;
    return `${coefficient < 0 ? ' - ' : ' + '}${body}`;
  }).join('');
}

function getTileSpans(type, orientation) {
  const [width, height] = TILE_SPANS[type] || [1, 1];
  if (['x', 'y', 'xy'].includes(type) && orientation === 'vertical') {
    return [height, width];
  }
  return [width, height];
}

function getTileBoardPosition(tile, mode, boardWidth, boardHeight = 0) {
  const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
  const [spanX, spanY] = getTileSpans(tile.type, orientation);
  const left = isEquationLikeMode(mode)
    ? (tile.side === 'right' ? boardWidth / 2 + 8 : 8) + (tile.x || 0) * GRID_UNIT
    : (tile.x || 0) * GRID_UNIT;
  const rowOffset = mode === 'systems'
    ? getSystemsRowTop(boardHeight, getSystemsEquationIndex(tile))
    : 0;
  const top = rowOffset + (tile.y || 0) * GRID_UNIT;
  const width = spanX * GRID_UNIT;
  const height = spanY * GRID_UNIT;
  return { left, top, width, height, centerX: left + width / 2, centerY: top + height / 2 };
}

export default function AlgebraTiles({
  activity = '', // Resource activity identifier used in input logs.
  tiles: sharedTiles, // Controlled tiles supplied by the parent.
  onTilesChange, // Reports tile updates to the parent.
  mode, // Selects equation, systems, area, or simplified layout.
  layout, // Legacy layout option kept for existing callers.
  variables: variableNames = ['x', 'y'], // Names shown for the two tile variables.
  equationSides: suppliedEquationSides = null, // Optional equation text shown on each side of the equation board.
  shared = false, // Shares the board state and teacher settings with the room.
  roomId = 'algebra-tiles-default', // Shared board room identifier.
  sessionApp = 'activity-runner', // Session app used to resolve the participant identity.
  role: suppliedRole, // Optional role override for standalone resource hosts.
  promptMode = 'json', // Uses exercise JSON or a teacher-authored expression on shared boards.
  showSelectionHint = true, // Shows the drag-selection hint when enabled.
  equationsFromTiles = false, // Builds displayed equations from the placed tiles when enabled.
  settingsPortalTarget = null, // Optional DOM target for teacher settings outside the board zone.
  settingsInPortal = false // Places teacher settings in the supplied portal target when true.
}) {
  const { t } = useTranslation('interface');
  const { t: tCommon } = useTranslation('common');
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const role = suppliedRole || sessionLogging?.role || 'student';
  const variables = normalizeVariables(variableNames);
  const activeMode = normalizeMode(mode, layout);
  const [localTiles, setLocalTiles] = useState([]);
  const [roomTiles, setRoomTiles] = useState([]);
  const [sharedMode, setSharedMode] = useState(mode || layout || 'equation');
  const [promptExpression, setPromptExpression] = useState('');
  const [promptExpressionDraft, setPromptExpressionDraft] = useState('');
  const [promptSendStatus, setPromptSendStatus] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const socketRef = useRef(null);
  const promptExpressionRef = useRef('');
  const promptEditedRef = useRef(false);
  const promptDraftEditedRef = useRef(false);
  const pendingPromptExpressionRef = useRef(null);
  const promptSendTimerRef = useRef(null);
  const promptInputId = useId();
  const [sourceOrientations, setSourceOrientations] = useState({ x: 'horizontal', y: 'horizontal', xy: 'horizontal' });
  const [sourceSigns, setSourceSigns] = useState({ one: 1, x: 1, y: 1, x2: 1, xy: 1, y2: 1 });
  const [mergeAnimation, setMergeAnimation] = useState(null);
  const [selectedTileIds, setSelectedTileIds] = useState(() => new Set());
  const [copiedTileCount, setCopiedTileCount] = useState(0);
  const [selectionBox, setSelectionBox] = useState(null);
  const mergeTimerRef = useRef(null);
  const placedBoardRef = useRef(null);
  const selectionStartRef = useRef(null);
  const copiedTilesRef = useRef([]);
  const tiles = shared ? roomTiles : Array.isArray(sharedTiles) ? sharedTiles : localTiles;
  const nonSharedMode = activeMode === 'equation' && Array.isArray(suppliedEquationSides) && suppliedEquationSides.length >= 2
    ? 'systems'
    : activeMode;
  const boardMode = shared ? sharedMode : nonSharedMode;
  const category = (sharedMode === 'equation' || sharedMode === 'systems') ? 'equations' : 'factorization';
  const availableExercises = exercises[category];
  const selectedExercise = availableExercises.find((item) => item.id === exerciseId) || availableExercises[0];
  const isMerging = Boolean(mergeAnimation);

  useEffect(() => {
    if (!shared) return undefined;
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
        setSharedMode(state.mode || 'simplified');
        const echoedExpression = pendingPromptExpressionRef.current;
        if (role === 'teacher' && echoedExpression !== null && state.promptExpression === echoedExpression) {
          if (promptSendTimerRef.current) window.clearTimeout(promptSendTimerRef.current);
          promptSendTimerRef.current = null;
          pendingPromptExpressionRef.current = null;
          promptExpressionRef.current = echoedExpression;
          promptEditedRef.current = true;
          promptDraftEditedRef.current = false;
          setPromptExpression(echoedExpression);
          setPromptExpressionDraft(echoedExpression);
          setPromptSendStatus('sent');
        } else if (role !== 'teacher' || !promptEditedRef.current) {
          promptExpressionRef.current = state.promptExpression || '';
          setPromptExpression(state.promptExpression || '');
          if (role !== 'teacher' || !promptDraftEditedRef.current) {
            setPromptExpressionDraft(state.promptExpression || '');
          }
        }
        setExerciseId(state.exerciseId || '');
        setRoomTiles(Array.isArray(state.tiles) ? state.tiles : []);
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      if (promptSendTimerRef.current) window.clearTimeout(promptSendTimerRef.current);
      promptSendTimerRef.current = null;
      pendingPromptExpressionRef.current = null;
    };
  }, [shared, roomId, sessionApp, role]);

  useEffect(() => {
    if (!shared) return undefined;
    const clearBeforeSession = (event) => {
      if (!event.detail?.clear || role !== 'teacher') return;
      setRoomTiles([]);
      event.detail.waitUntil(requestRealtimeAck(socketRef.current, 'algebra-tiles:clear-room', 'algebra-tiles:clear-room:ack', { roomId, sessionApp }));
    };
    window.addEventListener('strobe:session-starting', clearBeforeSession);
    return () => window.removeEventListener('strobe:session-starting', clearBeforeSession);
  }, [shared, role, roomId, sessionApp]);

  useEffect(() => () => {
    if (mergeTimerRef.current) window.clearTimeout(mergeTimerRef.current);
  }, []);
  const areaTiles = boardMode === 'area'
    ? tiles.reduce((groups, tile) => {
      const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
      const { width, height } = getTileDimensions(tile.type, orientation);
      const centerX = (tile.x || 0) * GRID_UNIT + width / 2;
      const centerY = (tile.y || 0) * GRID_UNIT + height / 2;
      if (centerY < T_CHART_AXIS_Y && centerX >= T_CHART_AXIS_X) groups.horizontal.push(tile);
      else if (centerY >= T_CHART_AXIS_Y && centerX < T_CHART_AXIS_X) groups.vertical.push(tile);
      else if (centerY >= T_CHART_AXIS_Y && centerX >= T_CHART_AXIS_X) groups.product.push(tile);
      return groups;
    }, { horizontal: [], vertical: [], product: [] })
    : null;
  const tileEquationSides = isEquationLikeMode(boardMode)
    ? (boardMode === 'systems'
      ? [0, 1].map((equationIndex) => ({
        left: tiles.filter((tile) => tile.side === 'left' && (Number.isInteger(tile.equationIndex) ? tile.equationIndex : 0) === equationIndex),
        right: tiles.filter((tile) => tile.side === 'right' && (Number.isInteger(tile.equationIndex) ? tile.equationIndex : 0) === equationIndex)
      }))
      : {
        left: tiles.filter((tile) => tile.side === 'left'),
        right: tiles.filter((tile) => tile.side === 'right')
      })
    : null;
  const normalizedExpression = promptExpression.trim()
    .replace(/^\\\((.*)\\\)$/s, '$1')
    .replace(/^\$([\s\S]*)\$$/, '$1');
  const expressionEquationSides = (() => {
    if (promptMode !== 'expression' || !isEquationLikeMode(boardMode)) return null;
    if (boardMode === 'equation') {
      const equationSeparator = normalizedExpression.indexOf('=');
      if (equationSeparator < 0) return null;
      return {
        left: normalizedExpression.slice(0, equationSeparator).trim(),
        right: normalizedExpression.slice(equationSeparator + 1).trim()
      };
    }

    const equations = normalizedExpression
      .split(/\\\\|\||\n|;/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (equations.length < 2) return null;

    const parsedEquations = equations.slice(0, 2).map((equation) => {
      const separator = equation.indexOf('=');
      if (separator < 0) return null;
      return {
        left: equation.slice(0, separator).trim(),
        right: equation.slice(separator + 1).trim()
      };
    });
    return parsedEquations.every(Boolean) ? parsedEquations : null;
  })();
  const expressionPrompt = promptMode === 'expression' && normalizedExpression && !expressionEquationSides
    ? normalizedExpression
    : '';
  const equationDisplaySides = expressionEquationSides
    || (equationsFromTiles ? tileEquationSides : suppliedEquationSides)
    || tileEquationSides;
  const horizontalBounds = areaTiles?.horizontal.reduce((bounds, tile) => {
    const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
    const { width, height } = getTileDimensions(tile.type, orientation);
    const left = (tile.x || 0) * GRID_UNIT;
    const top = (tile.y || 0) * GRID_UNIT;
    return {
      left: Math.min(bounds.left, left),
      right: Math.max(bounds.right, left + width),
      top: Math.min(bounds.top, top),
      bottom: Math.max(bounds.bottom, top + height)
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  const verticalBounds = areaTiles?.vertical.reduce((bounds, tile) => {
    const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
    const { width, height } = getTileDimensions(tile.type, orientation);
    const left = (tile.x || 0) * GRID_UNIT;
    const top = (tile.y || 0) * GRID_UNIT;
    return {
      left: Math.min(bounds.left, left),
      right: Math.max(bounds.right, left + width),
      top: Math.min(bounds.top, top),
      bottom: Math.max(bounds.bottom, top + height)
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

  const commitTiles = (nextTiles, logChange = true) => {
    if (!canEdit) return;
    if (shared) {
      setRoomTiles(nextTiles);
      socketRef.current?.emit('algebra-tiles:update', { roomId, sessionApp, tiles: nextTiles });
    } else setLocalTiles(nextTiles);
    onTilesChange?.(nextTiles);
    if (logChange) {
      sessionLogging?.logEvent('activity.tiles.changed', activity, {
        tiles: nextTiles.map(({ id, type, sign, orientation, x, y, side, equationIndex }) => ({ id, type, sign, orientation, x, y, side, equationIndex }))
      });
    }
  };

  const copySelectedTiles = () => {
    copiedTilesRef.current = tiles.filter((tile) => selectedTileIds.has(tile.id)).map((tile) => ({ ...tile }));
    setCopiedTileCount(copiedTilesRef.current.length);
  };

  const pasteCopiedTiles = () => {
    if (!canEdit || !copiedTilesRef.current.length) return;
    const copies = copiedTilesRef.current.map((tile) => ({
      ...tile,
      id: `${Date.now()}-${Math.random()}`,
      x: (tile.x || 0) + 1,
      y: (tile.y || 0) + 1
    }));
    commitTiles([...tiles, ...copies]);
    setSelectedTileIds(new Set(copies.map((tile) => tile.id)));
  };

  const getSelectionCoordinates = (event) => {
    const board = placedBoardRef.current;
    const bounds = board.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left + board.scrollLeft,
      y: event.clientY - bounds.top + board.scrollTop
    };
  };

  const beginSelection = (event) => {
    if (!canEdit || event.button !== 0 || event.target.closest('.algebra-tile')) return;
    const point = getSelectionCoordinates(event);
    selectionStartRef.current = { ...point, pointerId: event.pointerId };
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) setSelectedTileIds(new Set());
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectionBox({ left: point.x, top: point.y, width: 0, height: 0 });
  };

  const updateSelection = (event) => {
    const start = selectionStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const point = getSelectionCoordinates(event);
    const rect = {
      left: Math.min(start.x, point.x),
      top: Math.min(start.y, point.y),
      right: Math.max(start.x, point.x),
      bottom: Math.max(start.y, point.y)
    };
    setSelectionBox({ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top });
    const board = placedBoardRef.current;
    const hits = tiles.filter((tile) => {
      const position = getTileBoardPosition(tile, boardMode, board.clientWidth, board.clientHeight);
      return position.left < rect.right && position.left + position.width > rect.left
        && position.top < rect.bottom && position.top + position.height > rect.top;
    });
    setSelectedTileIds((current) => {
      const next = event.ctrlKey || event.metaKey || event.shiftKey ? new Set(current) : new Set();
      hits.forEach((tile) => next.add(tile.id));
      return next;
    });
  };

  const endSelection = (event) => {
    if (!selectionStartRef.current || selectionStartRef.current.pointerId !== event.pointerId) return;
    selectionStartRef.current = null;
    setSelectionBox(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const endTileDrag = (event, tileId) => {
    const board = placedBoardRef.current;
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    const { clientX, clientY } = event.nativeEvent;
    if (clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom) return;
    const ids = selectedTileIds.has(tileId) ? selectedTileIds : new Set([tileId]);
    commitTiles(tiles.filter((tile) => !ids.has(tile.id)));
    setSelectedTileIds(new Set());
  };

  const handleBoardShortcuts = (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      copySelectedTiles();
    } else if (event.key.toLowerCase() === 'v') {
      event.preventDefault();
      pasteCopiedTiles();
    }
  };

  useEffect(() => {
    if (shared) return undefined;
    const clearOnSessionStart = (event) => {
      if (event.detail?.clear && canEdit) commitTiles([]);
    };
    window.addEventListener('strobe:session-starting', clearOnSessionStart);
    return () => window.removeEventListener('strobe:session-starting', clearOnSessionStart);
  }, [shared, canEdit, onTilesChange, tiles]);

  const updateMode = (nextMode) => {
    if (role !== 'teacher') return;
    setSharedMode(nextMode);
    socketRef.current?.emit('algebra-tiles:mode', { roomId, sessionApp, mode: nextMode });
  };

  const updateExercise = (nextCategory, nextExerciseId) => {
    if (role !== 'teacher') return;
    const nextExercise = exercises[nextCategory].find((item) => item.id === nextExerciseId) || exercises[nextCategory][0];
    const nextMode = nextCategory === 'equations' ? 'equation' : 'area';
    setSharedMode(nextMode);
    setExerciseId(nextExercise.id);
    commitTiles([]);
    socketRef.current?.emit('algebra-tiles:exercise', { roomId, sessionApp, mode: nextMode, exerciseId: nextExercise.id });
  };

  const updatePromptExpressionDraft = (event) => {
    promptDraftEditedRef.current = true;
    setPromptExpressionDraft(event.target.value);
    setPromptSendStatus('');
  };

  const sendPromptExpression = () => {
    const nextExpression = promptExpressionDraft;
    const socket = socketRef.current;
    if (!socket?.connected) {
      setPromptSendStatus('disconnected');
      return;
    }

    if (promptSendTimerRef.current) window.clearTimeout(promptSendTimerRef.current);
    pendingPromptExpressionRef.current = nextExpression;
    setPromptSendStatus('sending');
    socket.emit('algebra-tiles:prompt', { roomId, sessionApp, promptExpression: nextExpression });
    promptSendTimerRef.current = window.setTimeout(() => {
      if (pendingPromptExpressionRef.current !== nextExpression) return;
      pendingPromptExpressionRef.current = null;
      promptSendTimerRef.current = null;
      setPromptSendStatus('failed');
    }, 3000);
  };

  const beginTileDrag = (event, tile) => {
    const groupedTiles = tile.id && selectedTileIds.has(tile.id)
      ? tiles.filter((item) => selectedTileIds.has(item.id))
      : [];
    event.dataTransfer.effectAllowed = tile.id ? 'move' : 'copy';
    const serialized = JSON.stringify({
      id: tile.id || '',
      type: tile.type,
      sign: tile.sign,
      orientation: tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal'),
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
      ...(groupedTiles.length > 1 ? { tiles: groupedTiles } : {})
    });
    event.dataTransfer.setData('application/x-algebra-tile', serialized);
    event.dataTransfer.setDragImage(event.currentTarget, event.nativeEvent.offsetX, event.nativeEvent.offsetY);
  };

  const rotateOrientation = (orientation) => orientation === 'vertical' ? 'horizontal' : 'vertical';

  const toggleTileSign = (tileId) => {
    commitTiles(tiles.map((tile) => tile.id === tileId ? { ...tile, sign: tile.sign < 0 ? 1 : -1 } : tile));
  };

  const renderSignButton = (sign, label, onClick, className = '') => (
    <button
      type="button"
      className={`algebra-tile__sign${className ? ` ${className}` : ''}`}
      aria-label={`Αλλαγή πρόσημου πλακιδίου ${label}`}
      disabled={!canEdit}
      draggable={false}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {sign < 0 ? '−' : '+'}
    </button>
  );

  const renderChoices = (type, key, orientation) => {
    const definition = getTileDefinition(type, variables);
    const canRotate = ['x', 'y', 'xy'].includes(type);
    const sign = sourceSigns[type] || 1;
    return (
      <div className={`algebra-tiles__choice-cell algebra-tiles__choice-cell--${type}`} key={key}>
        <div className={`algebra-tile-source-wrap${orientation === 'vertical' ? ' is-vertical' : ''}`}>
          <div
            className={`algebra-tile algebra-tile--source algebra-tile--${definition.className} is-${orientation} ${sign < 0 ? 'is-negative' : ''}`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            aria-label={`${orientation === 'vertical' ? 'Κατακόρυφο' : 'Οριζόντιο'} ${sign < 0 ? 'αρνητικό' : 'θετικό'} πλακίδιο ${definition.name}`}
            aria-disabled={!canEdit}
            draggable={canEdit}
            onDragStart={(event) => beginTileDrag(event, { type, sign, orientation })}>
            {sign < 0 ? `−${definition.label}` : definition.label}
            {renderSignButton(sign, definition.name, () => setSourceSigns((current) => ({ ...current, [type]: current[type] < 0 ? 1 : -1 })))}
            {canRotate ? <button type="button" className="algebra-tile__rotate" aria-label={`Περιστροφή πλακιδίου ${definition.name}`} disabled={!canEdit}
              draggable={false} onClick={(event) => {
                event.stopPropagation();
                setSourceOrientations((current) => ({ ...current, [type]: rotateOrientation(current[type]) }));
              }}>↻</button> : null}
          </div>
        </div>
      </div>
    );
  };

  const dropTile = (event) => {
    if (!canEdit || isMerging) return;
    event.preventDefault();

    try {
      const serialized = event.dataTransfer.getData('application/x-algebra-tile')
        || event.dataTransfer.getData('text/plain');
      const dragged = JSON.parse(serialized);
      const board = event.currentTarget;
      const bounds = board.getBoundingClientRect();
      const [spanX, spanY] = getTileSpans(dragged.type, dragged.orientation);
      const tileWidth = spanX * GRID_UNIT;
      const tileHeight = spanY * GRID_UNIT;
      const maxX = Math.max(0, Math.floor((board.clientWidth - tileWidth) / GRID_UNIT));
      const maxY = Math.max(0, Math.floor((board.clientHeight - tileHeight) / GRID_UNIT));
      const rawX = event.clientX - bounds.left + board.scrollLeft - dragged.offsetX;
      const rawY = event.clientY - bounds.top + board.scrollTop - dragged.offsetY;
      let x = Math.max(0, Math.min(maxX, Math.round(rawX / GRID_UNIT)));
      let y = Math.max(0, Math.min(maxY, Math.round(rawY / GRID_UNIT)));
      let orientation = dragged.orientation;
      let side;
      let equationIndex = 0;

      if (boardMode === 'area') {
        const isFactorTile = ['one', 'x', 'y'].includes(dragged.type);
        if (rawY < T_CHART_AXIS_Y && isFactorTile) {
          orientation = dragged.type === 'one' ? orientation : 'horizontal';
          const [factorSpanX, factorSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_AXIS_X / GRID_UNIT;
          const minY = T_CHART_HORIZONTAL_ROW_Y / GRID_UNIT;
          const factorMaxX = Math.max(minX, Math.floor((board.clientWidth - factorSpanX * GRID_UNIT) / GRID_UNIT));
          x = Math.max(minX, Math.min(factorMaxX, Math.round(rawX / GRID_UNIT)));
          y = Math.min(Math.max(0, Math.floor((board.clientHeight - factorSpanY * GRID_UNIT) / GRID_UNIT)), minY);
        } else if (rawX < T_CHART_AXIS_X && isFactorTile) {
          orientation = dragged.type === 'one' ? orientation : 'vertical';
          const [factorSpanX, factorSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_VERTICAL_COLUMN_X / GRID_UNIT;
          const minY = T_CHART_AXIS_Y / GRID_UNIT;
          const factorMaxY = Math.max(minY, Math.floor((board.clientHeight - factorSpanY * GRID_UNIT) / GRID_UNIT));
          x = minX;
          y = Math.max(minY, Math.min(factorMaxY, Math.round(rawY / GRID_UNIT)));
        } else if (rawX >= T_CHART_AXIS_X && rawY >= T_CHART_AXIS_Y) {
          const [productSpanX, productSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_AXIS_X / GRID_UNIT;
          const minY = T_CHART_AXIS_Y / GRID_UNIT;
          const productMaxX = Math.max(minX, Math.floor((board.clientWidth - productSpanX * GRID_UNIT) / GRID_UNIT));
          const productMaxY = Math.max(minY, Math.floor((board.clientHeight - productSpanY * GRID_UNIT) / GRID_UNIT));
          x = Math.max(minX, Math.min(productMaxX, Math.round(rawX / GRID_UNIT)));
          y = Math.max(minY, Math.min(productMaxY, Math.round(rawY / GRID_UNIT)));
        } else {
          return;
        }
      } else if (isEquationLikeMode(boardMode)) {
        const midpoint = board.clientWidth / 2;
        side = rawX + tileWidth / 2 < midpoint ? 'left' : 'right';
        const sideOffset = side === 'right' ? midpoint : 0;
        const sideWidth = board.clientWidth / 2 - GRID_UNIT;
        const maxSideX = Math.max(0, Math.floor((sideWidth - tileWidth) / GRID_UNIT));
        x = Math.max(0, Math.min(maxSideX, Math.round((rawX - sideOffset) / GRID_UNIT)));
        if (boardMode === 'systems') {
          const rowHeight = board.clientHeight / 2;
          const rowUsableHeight = Math.max(GRID_UNIT, rowHeight - SYSTEMS_ROW_HEADER_HEIGHT);
          equationIndex = rawY + tileHeight / 2 < rowHeight ? 0 : 1;
          const rowOffset = getSystemsRowTop(board.clientHeight, equationIndex);
          const maxRowY = Math.max(0, Math.floor((rowUsableHeight - tileHeight) / GRID_UNIT));
          y = Math.max(0, Math.min(maxRowY, Math.round((rawY - rowOffset) / GRID_UNIT)));
        }
      }
      const id = dragged.id || `${Date.now()}-${Math.random()}`;
      const dropX = event.clientX - bounds.left + board.scrollLeft;
      const dropY = event.clientY - bounds.top + board.scrollTop;
      const oppositeTile = tiles.find((tile) => {
        if (tile.id === id || tile.type !== dragged.type || (tile.sign < 0) === (dragged.sign < 0)) return false;
        if (isEquationLikeMode(boardMode) && tile.side !== side) return false;
        if (boardMode === 'systems' && (Number.isInteger(tile.equationIndex) ? tile.equationIndex : 0) !== equationIndex) return false;

        const tileOrientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
        const [existingWidth, existingHeight] = getTileSpans(tile.type, tileOrientation);
        const tileLeft = isEquationLikeMode(boardMode)
          ? (tile.side === 'right' ? board.clientWidth / 2 + 8 : 8) + (tile.x || 0) * GRID_UNIT
          : (tile.x || 0) * GRID_UNIT;
        const tileTop = (boardMode === 'systems'
          ? getSystemsRowTop(board.clientHeight, getSystemsEquationIndex(tile))
          : 0) + (tile.y || 0) * GRID_UNIT;
        return dropX >= tileLeft
          && dropX < tileLeft + existingWidth * GRID_UNIT
          && dropY >= tileTop
          && dropY < tileTop + existingHeight * GRID_UNIT;
      });
      const nextTiles = tiles.filter((tile) => tile.id !== id && tile.id !== oppositeTile?.id);
      const droppedTile = {
        id,
        type: dragged.type,
        sign: dragged.sign,
        orientation,
        x,
        y,
        ...(side ? { side } : {}),
        ...(boardMode === 'systems' ? { equationIndex: Number.isInteger(equationIndex) ? equationIndex : 0 } : {})
      };
      if (Array.isArray(dragged.tiles) && dragged.tiles.length > 1) {
        const primary = dragged.tiles.find((tile) => tile.id === dragged.id);
        if (!primary) return;
        const primaryOrigin = getTileBoardPosition(primary, boardMode, board.clientWidth, board.clientHeight);
        const primaryTarget = getTileBoardPosition(droppedTile, boardMode, board.clientWidth, board.clientHeight);
        const deltaX = primaryTarget.left - primaryOrigin.left;
        const deltaY = primaryTarget.top - primaryOrigin.top;
        const movedIds = new Set(dragged.tiles.map((tile) => tile.id));
        const movedTiles = dragged.tiles.map((tile) => {
          const position = getTileBoardPosition(tile, boardMode, board.clientWidth, board.clientHeight);
          const { width, height } = getTileDimensions(tile.type, tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal'));
          let targetLeft = Math.max(0, Math.min(board.clientWidth - width, position.left + deltaX));
          let targetTop = Math.max(0, Math.min(board.clientHeight - height, position.top + deltaY));
          let targetSide = tile.side;
          let targetEquationIndex = getSystemsEquationIndex(tile);
          let nextX = Math.round(targetLeft / GRID_UNIT);
          let nextY = Math.round(targetTop / GRID_UNIT);
          if (isEquationLikeMode(boardMode)) {
            targetSide = targetLeft + width / 2 < board.clientWidth / 2 ? 'left' : 'right';
            const sideOffset = targetSide === 'right' ? board.clientWidth / 2 + 8 : 8;
            const maxTileX = Math.max(0, Math.floor((board.clientWidth / 2 - GRID_UNIT - width) / GRID_UNIT));
            nextX = Math.max(0, Math.min(maxTileX, Math.round((targetLeft - sideOffset) / GRID_UNIT)));
            if (boardMode === 'systems') {
              targetEquationIndex = targetTop + height / 2 < board.clientHeight / 2 ? 0 : 1;
              const rowOffset = getSystemsRowTop(board.clientHeight, targetEquationIndex);
              const maxTileY = Math.max(0, Math.floor((board.clientHeight / 2 - SYSTEMS_ROW_HEADER_HEIGHT - height) / GRID_UNIT));
              nextY = Math.max(0, Math.min(maxTileY, Math.round((targetTop - rowOffset) / GRID_UNIT)));
            }
          } else {
            nextX = Math.max(0, Math.min(Math.floor((board.clientWidth - width) / GRID_UNIT), nextX));
            nextY = Math.max(0, Math.min(Math.floor((board.clientHeight - height) / GRID_UNIT), nextY));
          }
          return {
            ...tile,
            x: nextX,
            y: nextY,
            ...(isEquationLikeMode(boardMode) ? { side: targetSide } : {}),
            ...(boardMode === 'systems' ? { equationIndex: targetEquationIndex } : {})
          };
        });
        const movedById = new Map(movedTiles.map((tile) => [tile.id, tile]));
        commitTiles(tiles.map((tile) => movedById.get(tile.id) || tile));
        setSelectedTileIds(movedIds);
        return;
      }
      if (oppositeTile) {
        const existingPosition = getTileBoardPosition(oppositeTile, boardMode, board.clientWidth, board.clientHeight);
        const droppedPosition = getTileBoardPosition(droppedTile, boardMode, board.clientWidth, board.clientHeight);
        const centerX = (existingPosition.centerX + droppedPosition.centerX) / 2;
        const centerY = (existingPosition.centerY + droppedPosition.centerY) / 2;
        const animation = {
          [oppositeTile.id]: {
            x: `${centerX - existingPosition.centerX}px`,
            y: `${centerY - existingPosition.centerY}px`
          },
          [droppedTile.id]: {
            x: `${centerX - droppedPosition.centerX}px`,
            y: `${centerY - droppedPosition.centerY}px`
          }
        };
        const mergingTiles = [...nextTiles, droppedTile];
        commitTiles(mergingTiles, false);
        setMergeAnimation(animation);
        mergeTimerRef.current = window.setTimeout(() => {
          commitTiles(mergingTiles.filter((tile) => tile.id !== oppositeTile.id && tile.id !== droppedTile.id));
          setMergeAnimation(null);
          mergeTimerRef.current = null;
        }, 300);
        return;
      }
      nextTiles.push(droppedTile);

      commitTiles(nextTiles);
    } catch {
      // Ignore drops that did not originate from an algebra tile.
    }
  };

  const removeTile = (id) => {
    if (isMerging) return;
    if (isEquationLikeMode(boardMode)) {
      const selectedTile = tiles.find((tile) => tile.id === id);
      if (!selectedTile) return;
      const selectedEquationIndex = Number.isInteger(selectedTile.equationIndex) ? selectedTile.equationIndex : 0;
      const matchingTile = tiles.find((tile) => tile.side !== selectedTile.side
        && tile.type === selectedTile.type
        && (tile.sign < 0) === (selectedTile.sign < 0)
        && (boardMode !== 'systems' || (Number.isInteger(tile.equationIndex) ? tile.equationIndex : 0) === selectedEquationIndex));
      if (!matchingTile) return;
      commitTiles(tiles.filter((tile) => tile.id !== id && tile.id !== matchingTile.id));
      return;
    }
    commitTiles(tiles.filter((tile) => tile.id !== id));
  };
  const settingsAccordion = shared && role === 'teacher' ? (
    <Accordion title={tCommon('activityResourceSettings')} icon="🧩" className="collaborative-algebra-tiles__settings">
      {promptMode === 'expression' ? (
        <>
          <label className="collaborative-algebra-tiles__setting">
            {t('algebraTiles.boardMode')}
            <select value={sharedMode} onChange={(event) => updateMode(event.target.value)}>
              {['equation', 'systems', 'area', 'simplified'].map((nextMode) => (
                <option key={nextMode} value={nextMode}>{t(`algebraTiles.modes.${nextMode}`)}</option>
              ))}
            </select>
          </label>
          <div className="collaborative-algebra-tiles__setting">
            <label htmlFor={promptInputId}>{t('algebraTiles.promptExpression')}</label>
            <div className="collaborative-algebra-tiles__expression-entry">
              <input id={promptInputId} type="text" value={promptExpressionDraft} onChange={updatePromptExpressionDraft}
                placeholder={isEquationLikeMode(sharedMode) ? (sharedMode === 'systems' ? '2x + y = 7 | x - y = 2' : '2x + 3 = 7') : 'x^2 + 5x + 6'} maxLength={10000} />
              <button type="button" onClick={sendPromptExpression} disabled={promptSendStatus === 'sending'} aria-label={t('algebraTiles.sendToAll')} title={t('algebraTiles.sendToAll')}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
            {promptSendStatus ? (
              <span className={`collaborative-algebra-tiles__send-status is-${promptSendStatus}`} role="status">
                {t(`algebraTiles.sendStatus.${promptSendStatus}`)}
              </span>
            ) : null}
          </div>
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
  ) : null;
  return (
    <>
    <div className={shared ? 'collaborative-algebra-tiles' : undefined}>
      {shared && (promptMode === 'expression'
        ? (expressionPrompt ? <div className="collaborative-algebra-tiles__prompt">
          <span className="collaborative-algebra-tiles__prompt-label">{t('algebraTiles.prompt')}</span>
          <MathJaxText text={expressionPrompt} />
        </div> : null)
        : (selectedExercise ? <p className="collaborative-algebra-tiles__prompt">
          {category === 'factorization' ? `${t('algebraTiles.factorize')}: ` : ''}{selectedExercise.prompt}
        </p> : null))}
      {!settingsInPortal ? settingsAccordion : null}
      <div className={`algebra-tiles${isMerging ? ' has-merging-tiles' : ''}`} onKeyDown={handleBoardShortcuts}>
      <div className="algebra-tiles__selection-tools">
        {selectedTileIds.size ? <span aria-live="polite">{selectedTileIds.size} πλακίδια επιλεγμένα</span>
          : (showSelectionHint ? <span>Σύρε το ποντίκι σε κενή περιοχή για επιλογή πλακιδίων</span> : null)}
        <button type="button" onClick={copySelectedTiles} disabled={!selectedTileIds.size}>Αντιγραφή</button>
        <button type="button" onClick={pasteCopiedTiles} disabled={!copiedTileCount}>Επικόλληση</button>
      </div>
      <section className={`algebra-tiles__board${isEquationLikeMode(boardMode) ? ' algebra-tiles__board--equation' : ''}`} aria-label="Πίνακας πλακιδίων">
        {equationDisplaySides && !Array.isArray(equationDisplaySides) ? (
          <div className="algebra-tiles__equation-header" aria-live="polite">
            <div className="algebra-tiles__equation-side">{typeof equationDisplaySides.left === 'string'
              ? <MathJaxText text={equationDisplaySides.left} />
              : formatPolynomial(Array.isArray(equationDisplaySides.left) ? equationDisplaySides.left : [], variables)}</div>
            <div className="algebra-tiles__equation-side">{typeof equationDisplaySides.right === 'string'
              ? <MathJaxText text={equationDisplaySides.right} />
              : formatPolynomial(Array.isArray(equationDisplaySides.right) ? equationDisplaySides.right : [], variables)}</div>
            <span aria-hidden="true">=</span>
          </div>
        ) : null}
        <div ref={placedBoardRef} className={`algebra-tiles__placed${boardMode === 'area' ? ' is-area' : ''}${isEquationLikeMode(boardMode) ? ' is-equation' : ''}${boardMode === 'systems' ? ' is-systems' : ''}`}
          tabIndex={canEdit ? 0 : -1}
          onPointerDown={beginSelection}
          onPointerMove={updateSelection}
          onPointerUp={endSelection}
          onPointerCancel={endSelection}
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={dropTile}>
          {boardMode === 'systems' && Array.isArray(equationDisplaySides) ? (
            equationDisplaySides.slice(0, 2).map((equation, equationIndex) => (
              <div className={`algebra-tiles__equation-header algebra-tiles__equation-header--systems-row algebra-tiles__equation-header--systems-row-${equationIndex + 1}`}
                aria-live="polite" key={`equation-row-${equationIndex}`}>
                <div className="algebra-tiles__equation-side">{typeof equation?.left === 'string'
                  ? <MathJaxText text={equation.left} />
                  : formatPolynomial(Array.isArray(equation?.left) ? equation.left : [], variables)}</div>
                <div className="algebra-tiles__equation-side">{typeof equation?.right === 'string'
                  ? <MathJaxText text={equation.right} />
                  : formatPolynomial(Array.isArray(equation?.right) ? equation.right : [], variables)}</div>
                <span aria-hidden="true">=</span>
              </div>
            ))
          ) : null}
          {areaTiles?.horizontal.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--horizontal" style={{
              left: `${(horizontalBounds.left + horizontalBounds.right) / 2}px`,
              top: `${Math.max(0, horizontalBounds.top - 34)}px`
            }}>
              ({formatPolynomial(areaTiles.horizontal, variables)})
            </output>
          ) : null}
          {areaTiles?.vertical.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--vertical" style={{
              left: `${Math.max(0, verticalBounds.left - 80)}px`,
              top: `${(verticalBounds.top + verticalBounds.bottom) / 2}px`
            }}>
              ({formatPolynomial(areaTiles.vertical, variables)})
            </output>
          ) : null}
          {areaTiles ? (
            <output className="algebra-tiles__product" aria-live="polite">
              {formatPolynomial(areaTiles.product, variables)}
            </output>
          ) : null}
          {tiles.map((tile) => {
            const definition = getTileDefinition(tile.type, variables);
            if (!definition) return null;
            const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
            const [spanX, spanY] = getTileSpans(tile.type, orientation);
            return (
              <div key={tile.id} role="button" tabIndex={canEdit ? 0 : -1} draggable={canEdit} aria-disabled={!canEdit}
                onDragStart={(event) => beginTileDrag(event, tile)}
                onDragEnd={(event) => endTileDrag(event, tile.id)}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    setSelectedTileIds((current) => {
                      const next = new Set(current);
                      if (next.has(tile.id)) next.delete(tile.id);
                      else next.add(tile.id);
                      return next;
                    });
                    return;
                  }
                  removeTile(tile.id);
                }}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') removeTile(tile.id); }}
                className={`algebra-tile algebra-tile--${definition.className} is-${orientation} ${tile.sign < 0 ? 'is-negative' : ''}${selectedTileIds.has(tile.id) ? ' is-selected' : ''}${mergeAnimation?.[tile.id] ? ' is-merging' : ''}`}
                style={{
                  left: isEquationLikeMode(boardMode)
                    ? `calc(${tile.side === 'right' ? '50% + ' : ''}8px + ${(tile.x || 0) * GRID_UNIT}px)`
                    : `${(tile.x || 0) * GRID_UNIT}px`,
                  top: boardMode === 'systems'
                    ? `calc(${getSystemsEquationIndex(tile) === 1 ? '50% + ' : ''}${SYSTEMS_ROW_HEADER_HEIGHT + (tile.y || 0) * GRID_UNIT}px)`
                    : `${(tile.y || 0) * GRID_UNIT}px`,
                  ...(orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type)
                    ? { boxSizing: 'border-box', width: `${spanX * GRID_UNIT}px`, height: `${spanY * GRID_UNIT}px` }
                    : {}),
                  ...(mergeAnimation?.[tile.id] ? {
                    '--merge-x': mergeAnimation[tile.id].x,
                    '--merge-y': mergeAnimation[tile.id].y
                  } : {})
                }}
                aria-label={`${tile.sign < 0 ? 'Αρνητικό' : 'Θετικό'} πλακίδιο ${definition.name}`}
                title={`${definition.name}: ${isEquationLikeMode(boardMode)
                  ? 'Πάτησε για αφαίρεση ίσων πλακιδίων και από τις δύο πλευρές'
                  : 'Σύρε το πλακίδιο για μεταφορά ή πάτησε για αφαίρεση'}`}>
                {tile.sign < 0 ? `−${definition.label}` : definition.label}
                {renderSignButton(tile.sign, definition.name, () => toggleTileSign(tile.id))}
                {['x', 'y', 'xy'].includes(tile.type) ? <button type="button" className="algebra-tile__rotate" aria-label={`Περιστροφή πλακιδίου ${definition.name}`} disabled={!canEdit}
                  draggable={false} onClick={(event) => {
                    event.stopPropagation();
                    commitTiles(tiles.map((item) => item.id === tile.id ? { ...item, orientation: rotateOrientation(orientation) } : item));
                  }}>↻</button> : null}
              </div>
            );
          })}
          {selectionBox ? <div className="algebra-tiles__selection-box" style={{
            left: `${selectionBox.left}px`, top: `${selectionBox.top}px`,
            width: `${selectionBox.width}px`, height: `${selectionBox.height}px`
          }} aria-hidden="true" /> : null}
        </div>
      </section>

      <section className="algebra-tiles__palette" aria-label="Επιλογή πλακιδίων">
        {renderChoices('one', 'unit', 'horizontal')}
        {renderChoices('x', 'x', sourceOrientations.x)}
        {renderChoices('y', 'y', sourceOrientations.y)}
        {renderChoices('x2', 'x2', 'horizontal')}
        {renderChoices('xy', 'xy', sourceOrientations.xy)}
        {renderChoices('y2', 'y2', 'horizontal')}
      </section>
      </div>
    </div>
    {settingsInPortal && settingsPortalTarget && settingsAccordion
      ? createPortal(settingsAccordion, settingsPortalTarget)
      : null}
    </>
  );
}
