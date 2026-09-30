import React, { useEffect, useMemo, useState } from 'react';
import './GeogebraMonitor.css';

function loadRealtimeSocket() {
  if (window.createRealtimeSocket) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tool="realtime-socket"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load realtime socket script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/js/realtime-socket.js';
    script.async = true;
    script.dataset.tool = 'realtime-socket';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load realtime socket script.'));
    document.body.appendChild(script);
  });
}

function formatClock(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return '-';
  }

  return new Date(timestamp).toLocaleTimeString();
}

function describeAction(entry) {
  const objectName = entry.object || entry.to || entry.from || 'object';
  const actor = entry.by || 'unknown';

  switch (entry.action) {
    case 'add':
      return `${actor} created ${objectName}`;
    case 'update':
      return `${actor} moved/edited ${objectName}`;
    case 'remove':
      return `${actor} removed ${objectName}`;
    case 'rename':
      return `${actor} renamed ${objectName} to ${entry.to || '?'}`;
    case 'grant':
      return `${actor} granted access for ${objectName} to ${entry.targetUserId || '?'}`;
    case 'revoke':
      return `${actor} revoked access for ${objectName} from ${entry.targetUserId || '?'}`;
    case 'join':
      return `${actor} joined room ${entry.roomId || ''}`;
    default:
      return `${actor} ${entry.action || 'updated'} ${objectName}`;
  }
}

export default function GeogebraMonitor({ roomFilter = '', className = '' }) {
  const [socketReady, setSocketReady] = useState(false);
  const [snapshot, setSnapshot] = useState({ rooms: [], feed: [] });
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    async function setup() {
      try {
        await loadRealtimeSocket();
        if (cancelled) {
          return;
        }

        socket = window.createRealtimeSocket({ path: '/ws/realtime' });

        socket.on('connect', () => {
          setSocketReady(true);
          setErrorText('');
          socket.emit('geogebra:monitor:join', {});
        });

        socket.on('disconnect', () => {
          setSocketReady(false);
        });

        socket.on('connect_error', () => {
          setErrorText('Realtime connection failed.');
        });

        socket.on('geogebra:monitor:snapshot', (payload) => {
          if (!payload || cancelled) {
            return;
          }
          setSnapshot({
            rooms: Array.isArray(payload.rooms) ? payload.rooms : [],
            feed: Array.isArray(payload.feed) ? payload.feed : []
          });
        });

        socket.on('geogebra:monitor:event', (entry) => {
          if (!entry || cancelled) {
            return;
          }

          setSnapshot((current) => ({
            rooms: current.rooms,
            feed: [entry, ...current.feed].slice(0, 120)
          }));
        });

        socket.connect();
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : 'Failed to open GeoGebra monitor.');
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('geogebra:monitor:leave', {});
        socket.disconnect();
      }
    };
  }, []);

  const visibleRooms = useMemo(() => {
    const filter = String(roomFilter || '').trim().toLowerCase();
    if (!filter) {
      return snapshot.rooms;
    }
    return snapshot.rooms.filter((room) => String(room.id || '').toLowerCase().includes(filter));
  }, [snapshot.rooms, roomFilter]);

  return (
    <section className={`gg-monitor ${className}`.trim()}>
      <div className="gg-monitor__stats">
        <div className="gg-monitor__stat">
          <span className="gg-monitor__statLabel">Connection</span>
          <span className="gg-monitor__statValue">{socketReady ? 'Live' : 'Offline'}</span>
        </div>
        <div className="gg-monitor__stat">
          <span className="gg-monitor__statLabel">Connected rooms</span>
          <span className="gg-monitor__statValue">{visibleRooms.length}</span>
        </div>
        <div className="gg-monitor__stat">
          <span className="gg-monitor__statLabel">Active feed items</span>
          <span className="gg-monitor__statValue">{snapshot.feed.length}</span>
        </div>
      </div>

      {errorText ? <p className="page-feedback page-feedback--error">{errorText}</p> : null}

      <div className="gg-monitor__layout">
        <div className="gg-monitor__roomList">
          {visibleRooms.length ? visibleRooms.map((room) => (
            <article key={room.id} className="gg-monitor__room">
              <div className="gg-monitor__roomHeader">
                <h2 className="gg-monitor__roomTitle">Room {room.id}</h2>
                <span className="gg-monitor__meta">{room.members} members</span>
              </div>
              <div className="gg-monitor__meta">{room.objectCount} objects</div>
              {room.objects && room.objects.length ? (
                <ul className="gg-monitor__objectList">
                  {room.objects.map((object) => (
                    <li key={`${room.id}:${object.name}`}>
                      {object.name} by {object.owner || 'unknown'}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="gg-monitor__empty">No objects yet in this room.</div>
              )}
            </article>
          )) : (
            <div className="gg-monitor__empty">No collaborative rooms connected right now.</div>
          )}
        </div>

        <div className="gg-monitor__feed">
          {snapshot.feed.length ? snapshot.feed.map((entry, index) => (
            <article key={`${entry.at || index}-${entry.roomId || 'room'}`} className="gg-monitor__feedItem" data-action={entry.action || 'update'}>
              <div className="gg-monitor__feedHeader">
                <strong>{entry.roomId || 'room'}</strong>
                <span className="gg-monitor__meta">{formatClock(entry.at)}</span>
              </div>
              <p className="gg-monitor__feedText">{describeAction(entry)}</p>
            </article>
          )) : (
            <div className="gg-monitor__empty">Waiting for student activity.</div>
          )}
        </div>
      </div>
    </section>
  );
}
