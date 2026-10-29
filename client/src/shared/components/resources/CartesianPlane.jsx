import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readIdentitySnapshot } from '../menu/identityStorage';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './CartesianPlane.css';

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

/** Reports each selected point's distance to its nearest target. */
export function calculateCartesianDistances(points = [], targets = []) {
  const validTargets = targets.filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)));
  const distances = points.map((point) => validTargets.length
    ? Math.min(...validTargets.map((target) => Math.hypot(Number(point.x) - Number(target.x), Number(point.y) - Number(target.y))))
    : null);
  const measurable = distances.filter(Number.isFinite);
  return {
    distances,
    meanDistance: measurable.length ? measurable.reduce((total, distance) => total + distance, 0) / measurable.length : null
  };
}

function clipLineToPlane(line, minX, maxX, minY, maxY) {
  const start = line.start || { x: line.x1, y: line.y1 };
  const end = line.end || { x: line.x2, y: line.y2 };
  const dx = Number(end.x) - Number(start.x);
  const dy = Number(end.y) - Number(start.y);
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (Math.abs(dx) < 1e-8 && Math.abs(dy) < 1e-8)) return null;

  const intersections = [];
  const addIntersection = (x, y) => {
    if (x < minX - 1e-8 || x > maxX + 1e-8 || y < minY - 1e-8 || y > maxY + 1e-8) return;
    if (!intersections.some((point) => Math.hypot(point.x - x, point.y - y) < 1e-8)) intersections.push({ x, y });
  };
  if (Math.abs(dx) >= 1e-8) {
    [minX, maxX].forEach((x) => addIntersection(x, Number(start.y) + ((x - Number(start.x)) / dx) * dy));
  }
  if (Math.abs(dy) >= 1e-8) {
    [minY, maxY].forEach((y) => addIntersection(Number(start.x) + ((y - Number(start.y)) / dy) * dx, y));
  }
  if (intersections.length < 2) return null;
  let farthest = [intersections[0], intersections[1]];
  let maxDistance = Math.hypot(farthest[0].x - farthest[1].x, farthest[0].y - farthest[1].y);
  for (let first = 0; first < intersections.length; first += 1) {
    for (let second = first + 1; second < intersections.length; second += 1) {
      const distance = Math.hypot(intersections[first].x - intersections[second].x, intersections[first].y - intersections[second].y);
      if (distance > maxDistance) {
        maxDistance = distance;
        farthest = [intersections[first], intersections[second]];
      }
    }
  }
  return { start: farthest[0], end: farthest[1] };
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

/** Renders a shared Cartesian plane where participants can place points. */
export default function CartesianPlane({
  roomId = 'cartesian-plane-default',
  sessionApp = 'cartesian-plane-collab',
  minX = -10,
  maxX = 10,
  minY = -10,
  maxY = 10,
  targets = [],
  mode = 'points',
  maxPoints = null,
  maxLines = null,
  canEdit: canEditOverride,
  onPointsChange,
  onLinesChange,
  onScoreChange
}) {
  const { t } = useTranslation('interface');
  const session = useSessionInputLogger();
  const canEdit = typeof canEditOverride === 'boolean' ? canEditOverride : true;
  const socketRef = useRef(null);
  const pendingEventsRef = useRef([]);
  const identityRef = useRef(readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' }));
  const [participants, setParticipants] = useState([]);
  const [sharedSettings, setSharedSettings] = useState(null);
  const [pendingLinePoint, setPendingLinePoint] = useState(null);
  const [gestureLine, setGestureLine] = useState(null);
  const svgRef = useRef(null);
  const lineGestureRef = useRef(null);
  const width = 720;
  const height = 560;
  const padding = 48;
  const normalizeLimit = (value) => value !== null && value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0
    ? Number(value)
    : null;
  const requestedSettings = { minX, maxX, minY, maxY, targets, mode: mode === 'lines' ? 'lines' : 'points', maxPoints: normalizeLimit(maxPoints), maxLines: normalizeLimit(maxLines) };
  const requestedSettingsRef = useRef(requestedSettings);
  requestedSettingsRef.current = requestedSettings;
  const requestedTargetsKey = JSON.stringify(targets);
  const activeSettings = sharedSettings || requestedSettings;
  const activeMode = activeSettings.mode === 'lines' ? 'lines' : 'points';
  const pointLimit = activeSettings.maxPoints !== null && activeSettings.maxPoints !== undefined
    && Number.isInteger(Number(activeSettings.maxPoints)) && Number(activeSettings.maxPoints) >= 0
    ? Number(activeSettings.maxPoints)
    : null;
  const lineLimit = activeSettings.maxLines !== null && activeSettings.maxLines !== undefined
    && Number.isInteger(Number(activeSettings.maxLines)) && Number(activeSettings.maxLines) >= 0
    ? Number(activeSettings.maxLines)
    : null;
  const activeTargets = Array.isArray(activeSettings.targets) ? activeSettings.targets : targets;
  const xMin = Math.min(Number(activeSettings.minX) || 0, Number(activeSettings.maxX) || 0);
  const xMax = Math.max(Number(activeSettings.minX) || 0, Number(activeSettings.maxX) || 0);
  const yMin = Math.min(Number(activeSettings.minY) || 0, Number(activeSettings.maxY) || 0);
  const yMax = Math.max(Number(activeSettings.minY) || 0, Number(activeSettings.maxY) || 0);
  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1, yMax - yMin);
  const xToSvg = (x) => padding + ((x - xMin) / xSpan) * (width - padding * 2);
  const yToSvg = (y) => height - padding - ((y - yMin) / ySpan) * (height - padding * 2);
  const xTickStep = Math.max(1, Math.ceil(xSpan / 80));
  const yTickStep = Math.max(1, Math.ceil(ySpan / 80));
  const xTicks = Array.from({ length: Math.floor(xSpan / xTickStep) + 1 }, (_, index) => Math.ceil(xMin / xTickStep) * xTickStep + index * xTickStep).filter((x) => x <= xMax);
  const yTicks = Array.from({ length: Math.floor(ySpan / yTickStep) + 1 }, (_, index) => Math.ceil(yMin / yTickStep) * yTickStep + index * yTickStep).filter((y) => y <= yMax);
  const labelY = yMin <= 0 && yMax >= 0 ? yToSvg(0) + 20 : height - padding + 20;
  const labelX = xMin <= 0 && xMax >= 0 ? xToSvg(0) - 10 : padding + 8;
  const ownPoints = participants.find((participant) => participant.own)?.points || [];
  const ownLines = participants.find((participant) => participant.own)?.lines || [];
  const distanceSummary = calculateCartesianDistances(ownPoints, activeTargets);
  const isTeacher = ['teacher', 'admin'].includes(String(session?.role || '').toLowerCase());

  useEffect(() => {
    function syncIdentity() {
      identityRef.current = readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' });
    }
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('cartesian-plane:join', {
          roomId,
          sessionApp,
          settings: requestedSettingsRef.current,
          ...identityRef.current
        });
        pendingEventsRef.current.splice(0).forEach(({ event, payload }) => socket.emit(event, payload));
      });
      socket.on('cartesian-plane:state', (state) => {
        if (state?.roomId !== `cartesian-plane-${roomId}`) return;
        if (state.settings) setSharedSettings(state.settings);
        const nextParticipants = (state.participants || []).map((participant) => ({ ...participant, own: participant.id === socket.id }));
        setParticipants(nextParticipants);
        onPointsChange?.(nextParticipants.find((participant) => participant.own)?.points || []);
        onLinesChange?.(nextParticipants.find((participant) => participant.own)?.lines || []);
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, sessionApp, onLinesChange, onPointsChange]);

  useEffect(() => {
    if (!isTeacher) return;
    socketRef.current?.emit('cartesian-plane:settings', {
      roomId,
      settings: requestedSettingsRef.current
    });
  }, [isTeacher, maxLines, maxPoints, maxX, maxY, minX, minY, mode, requestedTargetsKey, roomId]);

  useEffect(() => {
    onScoreChange?.(distanceSummary);
  }, [distanceSummary.meanDistance, ownPoints.length, onScoreChange]);

  function selectPoint(event) {
    if (!canEdit || !svgRef.current) return;
    const svg = svgRef.current;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = event.clientX;
    screenPoint.y = event.clientY;
    const localPoint = screenPoint.matrixTransform(matrix.inverse());
    const nearestPoint = ownPoints.reduce((nearest, point, index) => {
      const svgPoint = svg.createSVGPoint();
      svgPoint.x = xToSvg(point.x);
      svgPoint.y = yToSvg(point.y);
      const renderedPoint = svgPoint.matrixTransform(matrix);
      const distance = Math.hypot(event.clientX - renderedPoint.x, event.clientY - renderedPoint.y);
      return distance <= 14 && (!nearest || distance < nearest.distance) ? { point, index, distance } : nearest;
    }, null);
    const emitPlaneEvent = (eventName, payload) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        pendingEventsRef.current.push({ event: eventName, payload });
        return;
      }
      socket.emit(eventName, payload);
    };
    if (nearestPoint) {
      emitPlaneEvent('cartesian-plane:remove-point', {
        roomId,
        sessionApp,
        pointId: nearestPoint.point.id,
        pointIndex: nearestPoint.index
      });
      session?.logEvent('activity.input.changed', roomId, { field: 'cartesianPointRemoved', value: nearestPoint.point });
      return;
    }
    if (pointLimit !== null && ownPoints.length >= pointLimit) return;
    const svgX = localPoint.x;
    const svgY = localPoint.y;
    const rawX = xMin + ((svgX - padding) / (width - padding * 2)) * xSpan;
    const rawY = yMax - ((svgY - padding) / (height - padding * 2)) * ySpan;
    const point = {
      x: Number(Math.max(xMin, Math.min(xMax, rawX)).toFixed(2)),
      y: Number(Math.max(yMin, Math.min(yMax, rawY)).toFixed(2))
    };
    const identity = identityRef.current;
    emitPlaneEvent('cartesian-plane:point', { roomId, sessionApp, point, ...identity });
    session?.logEvent('activity.input.changed', roomId, {
      field: 'cartesianPoint',
      value: point
    });
  }

  function getPlanePoint(event) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = event.clientX;
    screenPoint.y = event.clientY;
    const local = screenPoint.matrixTransform(matrix.inverse());
    const rawX = xMin + ((local.x - padding) / (width - padding * 2)) * xSpan;
    const rawY = yMax - ((local.y - padding) / (height - padding * 2)) * ySpan;
    return {
      x: Number(Math.max(xMin, Math.min(xMax, rawX)).toFixed(2)),
      y: Number(Math.max(yMin, Math.min(yMax, rawY)).toFixed(2)),
      svgX: local.x,
      svgY: local.y
    };
  }

  function emitLine(line) {
    if (lineLimit !== null && ownLines.length >= lineLimit) return;
    if (Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y) < 0.01) return;
    const socket = socketRef.current;
    const payload = { roomId, sessionApp, line, ...identityRef.current };
    if (!socket?.connected) pendingEventsRef.current.push({ event: 'cartesian-plane:line', payload });
    else socket.emit('cartesian-plane:line', payload);
    session?.logEvent('activity.input.changed', roomId, { field: 'cartesianLine', value: line });
  }

  function removeOwnLineAt(point) {
    const nearestLine = ownLines.reduce((nearest, line) => {
      const clipped = clipLineToPlane(line, xMin, xMax, yMin, yMax);
      if (!clipped) return nearest;
      const distance = distanceToSegment(
        { x: point.svgX, y: point.svgY },
        { x: xToSvg(clipped.start.x), y: yToSvg(clipped.start.y) },
        { x: xToSvg(clipped.end.x), y: yToSvg(clipped.end.y) }
      );
      return distance <= 12 && (!nearest || distance < nearest.distance) ? { line, distance } : nearest;
    }, null);
    if (!nearestLine) return false;
    const socket = socketRef.current;
    const payload = { roomId, sessionApp, lineId: nearestLine.line.id };
    if (!socket?.connected) pendingEventsRef.current.push({ event: 'cartesian-plane:remove-line', payload });
    else socket.emit('cartesian-plane:remove-line', payload);
    session?.logEvent('activity.input.changed', roomId, { field: 'cartesianLineRemoved', value: nearestLine.line });
    return true;
  }

  function handleLinePointerDown(event) {
    if (!canEdit || activeMode !== 'lines') return;
    const point = getPlanePoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    lineGestureRef.current = { point, clientX: event.clientX, clientY: event.clientY, moved: false };
  }

  function handleLinePointerMove(event) {
    const gesture = lineGestureRef.current;
    if (!gesture || activeMode !== 'lines') return;
    if (Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > 6) gesture.moved = true;
    if (!gesture.moved) return;
    const point = getPlanePoint(event);
    if (point) setGestureLine({ start: gesture.point, end: point });
  }

  function handleLinePointerUp(event) {
    const gesture = lineGestureRef.current;
    if (!gesture || activeMode !== 'lines') return;
    lineGestureRef.current = null;
    setGestureLine(null);
    const point = getPlanePoint(event);
    if (!point) return;
    if (gesture.moved || Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > 6) {
      emitLine({ start: gesture.point, end: point });
      setPendingLinePoint(null);
      return;
    }
    if (removeOwnLineAt(point)) return;
    if (lineLimit !== null && ownLines.length >= lineLimit) return;
    if (!pendingLinePoint) {
      setPendingLinePoint(point);
      return;
    }
    emitLine({ start: pendingLinePoint, end: point });
    setPendingLinePoint(null);
  }

  function cancelLineGesture() {
    lineGestureRef.current = null;
    setGestureLine(null);
  }

  return (
    <div className="cartesian-plane-resource">
      <svg
        ref={svgRef}
        className={`cartesian-plane-resource__canvas${canEdit ? '' : ' is-locked'}${activeMode === 'lines' ? ' is-lines-mode' : ''}`}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        aria-label={t('cartesianPlane.ariaLabel')}
        onClick={activeMode === 'points' ? selectPoint : undefined}
        onPointerDown={activeMode === 'lines' ? handleLinePointerDown : undefined}
        onPointerMove={activeMode === 'lines' ? handleLinePointerMove : undefined}
        onPointerUp={activeMode === 'lines' ? handleLinePointerUp : undefined}
        onPointerCancel={activeMode === 'lines' ? cancelLineGesture : undefined}
      >
        <rect className="cartesian-plane-resource__background" x="0" y="0" width={width} height={height} />
        {xTicks.map((x) => <g key={`x-${x}`}>
          <line className="cartesian-plane-resource__gridline" x1={xToSvg(x)} x2={xToSvg(x)} y1={padding} y2={height - padding} />
          <text className="cartesian-plane-resource__axis-number" x={xToSvg(x)} y={labelY} textAnchor="middle">{x}</text>
        </g>)}
        {yTicks.map((y) => <g key={`y-${y}`}>
          <line className="cartesian-plane-resource__gridline" x1={padding} x2={width - padding} y1={yToSvg(y)} y2={yToSvg(y)} />
          {y !== 0 ? <text className="cartesian-plane-resource__axis-number" x={labelX} y={yToSvg(y) + 5} textAnchor="end">{y}</text> : null}
        </g>)}
        {xMin <= 0 && xMax >= 0 ? <line className="cartesian-plane-resource__axis" x1={xToSvg(0)} x2={xToSvg(0)} y1={padding} y2={height - padding} /> : null}
        {yMin <= 0 && yMax >= 0 ? <line className="cartesian-plane-resource__axis" x1={padding} x2={width - padding} y1={yToSvg(0)} y2={yToSvg(0)} /> : null}
        {participants.flatMap((participant) => (participant.lines || []).map((line, index) => {
          const clipped = clipLineToPlane(line, xMin, xMax, yMin, yMax);
          if (!clipped) return null;
          return (
            <line
              key={`${participant.id}-line-${line.id || index}`}
              className={`cartesian-plane-resource__line${participant.own ? ' is-own' : ''}`}
              x1={xToSvg(clipped.start.x)}
              y1={yToSvg(clipped.start.y)}
              x2={xToSvg(clipped.end.x)}
              y2={yToSvg(clipped.end.y)}
              style={{ stroke: participant.color || '#4ECDC4' }}
            >
              <title>{`${participant.name}: (${line.start.x}, ${line.start.y}) – (${line.end.x}, ${line.end.y})`}</title>
            </line>
          );
        }))}
        {gestureLine ? <line
          className="cartesian-plane-resource__line is-preview"
          x1={xToSvg(gestureLine.start.x)}
          y1={yToSvg(gestureLine.start.y)}
          x2={xToSvg(gestureLine.end.x)}
          y2={yToSvg(gestureLine.end.y)}
        /> : null}
        {pendingLinePoint ? <circle
          className="cartesian-plane-resource__line-anchor"
          cx={xToSvg(pendingLinePoint.x)}
          cy={yToSvg(pendingLinePoint.y)}
          r="6"
        /> : null}
        {activeTargets.map((target, index) => <circle key={`target-${index}`} className="cartesian-plane-resource__target" cx={xToSvg(Number(target.x))} cy={yToSvg(Number(target.y))} r="8"><title>{`(${target.x}, ${target.y})`}</title></circle>)}
        {participants.flatMap((participant) => (participant.points || []).map((point, index) => (
          <g key={`${participant.id}-${index}`} className={`cartesian-plane-resource__point${participant.own ? ' is-own' : ''}`}>
            <circle cx={xToSvg(point.x)} cy={yToSvg(point.y)} r="7" style={{ fill: participant.color || '#4ECDC4' }} />
            <title>{`${participant.name}: (${point.x}, ${point.y})`}</title>
          </g>
        )))}
      </svg>
      <div className="cartesian-plane-resource__legend" aria-live="polite">
        {activeMode === 'lines' ? (
          <>
            <span>{t(lineLimit === null ? 'cartesianPlane.lineCount' : 'cartesianPlane.lineCountLimit', { count: ownLines.length, max: lineLimit })}</span>
            <span>{t('cartesianPlane.lineDrawHelp')}</span>
          </>
        ) : <span>{t(pointLimit === null ? 'cartesianPlane.pointCount' : 'cartesianPlane.pointCountLimit', { count: ownPoints.length, max: pointLimit })}</span>}
        {distanceSummary.meanDistance !== null ? <span>{t('cartesianPlane.meanDistance', { distance: distanceSummary.meanDistance.toFixed(2) })}</span> : null}
      </div>
    </div>
  );
}
