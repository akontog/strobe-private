import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readIdentitySnapshot } from '../menu/identityStorage';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import { requestRealtimeAck } from '../../utils/realtimeAck';
import './NumberLine.css';

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

/** Renders one shared point or interval for each participant. */
export default function NumberLine({
  roomId = 'number-line-default', // Shared number line room identifier.
  sessionApp = 'geogebra-collab', // Session app used to resolve the participant identity.
  min = -10, // Lowest integer shown on the number line.
  max = 10, // Highest integer shown on the number line.
  linePosition = 0.72, // Vertical position of the number line as a fraction of the canvas height.
  snapThreshold = 0.16, // Distance from an integer at which a point snaps to that integer.
  stackTolerance = 0.08 // Distance at which identical points or interval bounds share a vertical stack.
}) {
  const { t } = useTranslation('interface');
  const session = useSessionInputLogger();
  const canEdit = session?.canEdit ?? true;
  const socketRef = useRef(null);
  const svgRef = useRef(null);
  const pointerRef = useRef(null);
  const identityRef = useRef(readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' }));
  const [marks, setMarks] = useState([]);
  const [draftInterval, setDraftInterval] = useState(null);
  const width = 1000;
  const height = 360;
  const padding = 48;
  const axisY = Math.max(0.55, Math.min(0.9, linePosition)) * height;
  const firstInteger = Math.ceil(min);
  const lastInteger = Math.floor(max);
  const range = Math.max(1, max - min);
  const valueToX = (value) => padding + ((value - min) / range) * (width - padding * 2);

  useEffect(() => {
    function syncIdentity() {
      const next = readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' });
      identityRef.current = next;
      const ownMark = marks.find((mark) => mark.own);
      if (ownMark) socketRef.current?.emit('number-line:mark', { roomId, sessionApp, ...ownMark, ...next });
    }
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, [marks, roomId, sessionApp]);

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('number-line:join', { roomId, sessionApp, ...identityRef.current });
      });
      socket.on('number-line:state', (state) => {
        if (state?.roomId !== `number-line-${roomId}`) return;
        setMarks((state.marks || []).map((mark) => ({ ...mark, own: mark.id === socket.id })));
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, sessionApp]);

  useEffect(() => {
    const clearBeforeSession = (event) => {
      if (!event.detail?.clear || !canEdit) return;
      pointerRef.current = null;
      setDraftInterval(null);
      event.detail.waitUntil(requestRealtimeAck(
        socketRef.current,
        'number-line:clear-room',
        'number-line:clear-room:ack',
        { roomId, sessionApp }
      ));
    };
    window.addEventListener('strobe:session-starting', clearBeforeSession);
    return () => window.removeEventListener('strobe:session-starting', clearBeforeSession);
  }, [canEdit, roomId, sessionApp]);

  function emitMark(mark) {
    socketRef.current?.emit('number-line:mark', { roomId, sessionApp, ...mark, ...identityRef.current });
  }

  function valueFromEvent(event) {
    const svg = svgRef.current;
    if (!svg) return min;
    const bounds = svg.getBoundingClientRect();
    const rawValue = min + ((event.clientX - bounds.left) / bounds.width) * range;
    return Math.max(min, Math.min(max, Math.abs(rawValue - Math.round(rawValue)) <= snapThreshold ? Math.round(rawValue) : rawValue));
  }

  function stackIndex(mark) {
    return marks
      .filter((candidate) => candidate.kind === mark.kind && (mark.kind === 'point'
        ? Math.abs(candidate.value - mark.value) <= stackTolerance
        : Math.abs(candidate.start - mark.start) <= stackTolerance && Math.abs(candidate.end - mark.end) <= stackTolerance))
      .sort((left, right) => left.id.localeCompare(right.id))
      .findIndex((candidate) => candidate.id === mark.id);
  }

  function finishDrawing(event) {
    const activePointer = pointerRef.current;
    if (!activePointer || activePointer.id !== event.pointerId) return;
    if (!canEdit) {
      pointerRef.current = null;
      setDraftInterval(null);
      return;
    }
    const end = valueFromEvent(event);
    if (activePointer.moved) {
      const start = Math.min(activePointer.start, end);
      const finish = Math.max(activePointer.start, end);
      if (finish - start < 0.01) emitMark({ kind: 'point', value: start });
      else emitMark({ kind: 'interval', start, end: finish, leftClosed: true, rightClosed: true });
      setDraftInterval(null);
    } else {
      const ownPoint = marks.find((mark) => mark.own && mark.kind === 'point');
      const clickTolerance = (range * 22) / (width - padding * 2);
      if (ownPoint && Math.abs(ownPoint.value - end) <= clickTolerance) {
        socketRef.current?.emit('number-line:clear', { roomId, sessionApp });
      } else {
        emitMark({ kind: 'point', value: end });
      }
    }
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="number-line-resource">
      <svg
        ref={svgRef}
        className={`number-line-resource__canvas${canEdit ? '' : ' is-locked'}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="application"
        aria-label={t('numberLine.ariaLabel')}
        onPointerDown={(event) => {
          if (!canEdit) return;
          const targetMark = event.target.closest?.('[data-mark-id]');
          if (targetMark?.dataset.markId === socketRef.current?.id) {
            const ownMark = marks.find((mark) => mark.id === targetMark.dataset.markId);
            if (ownMark?.kind === 'interval' && targetMark.dataset.endpoint) {
              const endpoint = targetMark.dataset.endpoint;
              emitMark({
                ...ownMark,
                [endpoint === 'left' ? 'leftClosed' : 'rightClosed']: !(endpoint === 'left' ? ownMark.leftClosed : ownMark.rightClosed)
              });
            } else if (ownMark?.kind === 'point') {
              socketRef.current?.emit('number-line:clear', { roomId, sessionApp });
            }
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          const start = valueFromEvent(event);
          pointerRef.current = { id: event.pointerId, start, clientX: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          const activePointer = pointerRef.current;
          if (!activePointer || activePointer.id !== event.pointerId) return;
          if (!activePointer.moved && Math.abs(event.clientX - activePointer.clientX) < 5) return;
          activePointer.moved = true;
          setDraftInterval({ start: activePointer.start, end: valueFromEvent(event) });
        }}
        onPointerUp={finishDrawing}
        onPointerCancel={() => { pointerRef.current = null; setDraftInterval(null); }}
      >
        {Array.from({ length: Math.max(0, lastInteger - firstInteger + 1) }, (_, index) => firstInteger + index).map((value) => (
          <g key={value} className="number-line-resource__tick">
            <line x1={valueToX(value)} x2={valueToX(value)} y1="35" y2={axisY + 32} />
            <text x={valueToX(value)} y={axisY + 57} textAnchor="middle">{value}</text>
          </g>
        ))}
        <line className="number-line-resource__axis" x1={padding} x2={width - padding} y1={axisY} y2={axisY} />
        {draftInterval ? (
          <line className="number-line-resource__draft" x1={valueToX(Math.min(draftInterval.start, draftInterval.end))} x2={valueToX(Math.max(draftInterval.start, draftInterval.end))} y1={axisY - 15} y2={axisY - 15} />
        ) : null}
        {marks.map((mark) => {
          const stackY = axisY - 15 - stackIndex(mark) * 30;
          if (mark.kind === 'interval') {
            const x1 = valueToX(mark.start);
            const x2 = valueToX(mark.end);
            const bracketText = `${mark.leftClosed ? '[' : '('}${Number(mark.start.toFixed(2))}, ${Number(mark.end.toFixed(2))}${mark.rightClosed ? ']' : ')'}`;
            return (
              <g key={mark.id} className={`number-line-resource__mark${mark.own ? ' is-own' : ''}`}>
                <line className="number-line-resource__stem" x1={x1} x2={x1} y1={axisY} y2={stackY} style={{ stroke: mark.color }} />
                <line className="number-line-resource__stem" x1={x2} x2={x2} y1={axisY} y2={stackY} style={{ stroke: mark.color }} />
                <line className="number-line-resource__interval" x1={x1} x2={x2} y1={stackY} y2={stackY} style={{ stroke: mark.color }} />
                <circle cx={x1} cy={stackY} r="8" data-mark-id={mark.id} data-endpoint="left" className={mark.leftClosed ? 'is-closed' : 'is-open'} style={{ stroke: mark.color, fill: mark.leftClosed ? mark.color : '#fff' }} />
                <circle cx={x2} cy={stackY} r="8" data-mark-id={mark.id} data-endpoint="right" className={mark.rightClosed ? 'is-closed' : 'is-open'} style={{ stroke: mark.color, fill: mark.rightClosed ? mark.color : '#fff' }} />
                <text className="number-line-resource__name" x={(x1 + x2) / 2} y={stackY - 17} textAnchor="middle">{mark.name} {bracketText}</text>
                <title>{mark.name}: {bracketText}</title>
              </g>
            );
          }
          const x = valueToX(mark.value);
          return (
            <g key={mark.id} className={`number-line-resource__mark${mark.own ? ' is-own' : ''}`}>
              <line className="number-line-resource__stem" x1={x} x2={x} y1={axisY} y2={stackY} style={{ stroke: mark.color }} />
              <circle cx={x} cy={stackY} r="10" data-mark-id={mark.id} style={{ fill: mark.color }} />
              <text className="number-line-resource__name" x={x} y={stackY - 17} textAnchor="middle">{mark.name} ({Number(mark.value.toFixed(2))})</text>
              <title>{mark.name}: {Number(mark.value.toFixed(2))}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
