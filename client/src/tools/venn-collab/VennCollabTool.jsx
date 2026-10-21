import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FullScreenButton, HeroTitle, VennBoard, useSessionInputLogger } from '../../shared/components';
import { requestRealtimeAck } from '../../shared/utils/realtimeAck';

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

const items = Array.from({ length: 20 }, (_, index) => ({
  id: String(index + 1),
  content: String(index + 1)
}));

/** Opens a live Venn board for the current classroom. */
export default function VennCollabTool() {
  const { t: tNav } = useTranslation('navigation');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'venn-default';
  const session = useSessionInputLogger();
  const socketRef = useRef(null);
  const [placements, setPlacements] = useState({});
  const sets = [
    { id: 'set-a', title: '\u0391' },
    { id: 'set-b', title: '\u0392' }
  ];

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('venn:join', { roomId }));
      socket.on('venn:state', (state) => {
        if (state?.roomId === `venn-${roomId}`) setPlacements(state.placements || {});
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    const clearBoard = (event) => {
      if (!event.detail?.clear || !(session?.canEdit ?? true)) return;
      event.detail.waitUntil(requestRealtimeAck(
        socketRef.current,
        'venn:clear-room',
        'venn:clear-room:ack',
        { roomId }
      ));
    };
    window.addEventListener('strobe:session-starting', clearBoard);
    return () => window.removeEventListener('strobe:session-starting', clearBoard);
  }, [roomId, session?.canEdit]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle title={tNav('items.venn')} />
        <section className="common-zone lab-zone">
          <FullScreenButton />
          <div className="lab-workspace">
            <div className="lab-card lab-card--panel">
              <VennBoard
                items={items}
                sets={sets}
                placements={placements}
                onChange={(nextPlacements) => {
                  setPlacements(nextPlacements);
                  socketRef.current?.emit('venn:placements', { roomId, placements: nextPlacements, sessionApp: 'geogebra-collab' });
                }}
                activity="venn-board-collaboration"
                bankLabel=""
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
