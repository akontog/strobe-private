import React, { useEffect, useMemo, useState } from 'react';
import CollaborativeGeoGebra from './CollaborativeGeoGebra';
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
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [grantInputs, setGrantInputs] = useState({});

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
        window.__geogebraMonitorSocket = socket;

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

  const selectedRoom = useMemo(() => {
    if (!visibleRooms.length) {
      return null;
    }

    return visibleRooms.find((room) => room.id === selectedRoomId) || visibleRooms[0];
  }, [selectedRoomId, visibleRooms]);

  const roomsToRender = useMemo(() => {
    return selectedRoom ? [selectedRoom] : [];
  }, [selectedRoom]);

  useEffect(() => {
    if (!visibleRooms.length) {
      setSelectedRoomId('');
      return;
    }

    if (!selectedRoomId || !visibleRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(visibleRooms[0].id);
    }
  }, [selectedRoomId, visibleRooms]);

  function emitGrant(roomId, objectName, userId) {
    if (!roomId || !objectName || !String(userId || '').trim()) {
      return;
    }

    const socket = window.__geogebraMonitorSocket;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('geogebra:grant', {
      roomId,
      name: objectName,
      userId: String(userId).trim()
    });
  }

  function emitClear(roomId, objectName) {
    if (!socketReady || !roomId || !window.createRealtimeSocket) {
      return;
    }

    const socket = window.__geogebraMonitorSocket;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('geogebra:clear', { roomId, name: objectName || null });
  }

  function emitClearFeed() {
    const socket = window.__geogebraMonitorSocket;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('geogebra:monitor:clear-feed', {});
  }

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

      <div className="gg-monitor__toolbar">
        <label className="gg-monitor__field">
          <span>Room</span>
          <select
            className="gg-monitor__select"
            value={selectedRoomId}
            onChange={(event) => setSelectedRoomId(event.target.value)}
            disabled={!visibleRooms.length}
          >
            {visibleRooms.length ? visibleRooms.map((room) => (
              <option key={room.id} value={room.id}>{room.id}</option>
            )) : <option value="">No rooms</option>}
          </select>
        </label>
        <button type="button" className="gg-monitor__clearButton" onClick={emitClearFeed}>
          Clear messages
        </button>
      </div>

      {selectedRoom ? (
        <div className="gg-monitor__preview">
          <div className="gg-monitor__previewHeader">
            <h3>Board preview</h3>
            <span className="gg-monitor__meta">{selectedRoom.id}</span>
          </div>
          <CollaborativeGeoGebra
            roomId={selectedRoom.id}
            className="gg-monitor__board"
            showLegend={false}
            showToolBar
            showAlgebraView={false}
            showAlgebraInput={false}
            showMenuBar={false}
            showResetIcon={false}
            showZoomButtons={false}
            showFullscreenButton={false}
            showSuggestionButtons={false}
          />
        </div>
      ) : null}

      <div className="gg-monitor__layout">
        <div className="gg-monitor__roomList">
          {roomsToRender.length ? roomsToRender.map((room) => {
            const selected = room.id === selectedRoomId;
            return (
              <article key={room.id} className="gg-monitor__room">
                <div className="gg-monitor__roomHeader">
                  <h2 className="gg-monitor__roomTitle">Room {room.id}</h2>
                  <span className="gg-monitor__meta">{room.members} members</span>
                </div>
                <div className="gg-monitor__meta">{room.objectCount} objects</div>
                <button type="button" className="gg-monitor__clearButton" onClick={() => emitClear(room.id)}>
                  Clear room
                </button>
                {room.objects && room.objects.length ? (
                  <ul className="gg-monitor__objectList">
                    {room.objects.map((object) => {
                      const grantKey = `${room.id}:${object.name}`;
                      const grantTarget = grantInputs[grantKey] || '';
                      const memberOptions = Array.isArray(room.memberList) ? room.memberList : [];
                      const grantOptions = memberOptions.length > 0
                        ? memberOptions.map((member) => String(member.displayName || member.userId || member.socketId || ''))
                        : [];
                      const uniqueGrantOptions = [...new Set(grantOptions.filter(Boolean))];

                      return (
                        <li key={grantKey}>
                          <div className="gg-monitor__objectRow">
                            <span>{object.name} by {object.owner || 'unknown'}</span>
                            <button type="button" className="gg-monitor__clearButton gg-monitor__clearButton--small" onClick={() => emitClear(room.id, object.name)}>
                              Remove
                            </button>
                          </div>
                          {selected ? (
                            <div className="gg-monitor__grantRow">
                              {uniqueGrantOptions.length ? (
                                <select
                                  className="gg-monitor__select gg-monitor__select--small"
                                  value={grantTarget}
                                  onChange={(event) => setGrantInputs((current) => ({
                                    ...current,
                                    [grantKey]: event.target.value
                                  }))}
                                >
                                  <option value="">Select user</option>
                                  {uniqueGrantOptions.map((userId) => (
                                    <option key={`${room.id}:${object.name}:${userId}`} value={userId}>{userId}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="gg-monitor__input"
                                  type="text"
                                  placeholder="grant to userId"
                                  value={grantTarget}
                                  onChange={(event) => setGrantInputs((current) => ({
                                    ...current,
                                    [grantKey]: event.target.value
                                  }))}
                                />
                              )}
                              <button
                                type="button"
                                className="gg-monitor__clearButton gg-monitor__clearButton--small"
                                onClick={() => emitGrant(room.id, object.name, grantTarget)}
                              >
                                Grant
                              </button>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="gg-monitor__empty">No objects yet in this room.</div>
                )}
              </article>
            );
          }) : (
            <div className="gg-monitor__empty">Select a room to inspect.</div>
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
