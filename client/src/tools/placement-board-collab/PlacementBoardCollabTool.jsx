import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, parseOptionsExpression, PlacementBoard } from '../../shared/components';
import './PlacementBoardCollabTool.css';

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

const defaultSettings = { elements: '1:12', groups: 'A,B' };

/** Opens a shared placement board with teacher-controlled items and regions. */
export default function PlacementBoardCollabTool({ role = 'student' }) {
  const { t: tNav } = useTranslation('navigation');
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'placement-board-default';
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const socketRef = useRef(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [draft, setDraft] = useState(defaultSettings);
  const [placements, setPlacements] = useState({});

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('placement-board:join', { roomId }));
      socket.on('placement-board:state', (state) => {
        if (state?.roomId !== `placement-board-${roomId}`) return;
        setPlacements(state.placements || {});
        if (state.settings) {
          setSettings(state.settings);
          setDraft(state.settings);
        }
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const items = parseOptionsExpression(settings.elements).slice(0, 100).map((item) => ({ id: item.id, content: item.label }));
  const groups = settings.groups.split(',').map((title) => title.trim()).filter(Boolean).slice(0, 12)
    .map((title, index) => ({ id: `group-${index + 1}`, title }));

  function applySettings(event) {
    event.preventDefault();
    socketRef.current?.emit('placement-board:settings', { roomId, settings: draft });
  }

  function updatePlacements(nextPlacements) {
    setPlacements(nextPlacements);
    socketRef.current?.emit('placement-board:placements', {
      roomId,
      placements: nextPlacements,
      sessionApp: 'placement-board-collab'
    });
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="placement-board-collab" roomId={roomId} role={role} defaultTitle={tNav('items.placementBoard')} config={settings}>
              <PlacementBoard
                items={items}
                groups={groups}
                placements={placements}
                onChange={updatePlacements}
                activity="placement-board-collaboration"
                bankLabel={t('placementBoard.items')}
              />
        </ActivitySettingsAccordion>
        {isTeacher ? (
          <Accordion title={t('activityResourceSettings', { ns: 'common' })} icon="🧩">
            <form className="placement-board-collab__settings" onSubmit={applySettings}>
              <label>
                <span>{t('placementBoard.elements')}</span>
                <input type="text" value={draft.elements} onChange={(event) => setDraft({ ...draft, elements: event.target.value })} />
              </label>
              <p>{t('activityBuilder.optionsExpressionHelp')}</p>
              <label>
                <span>{t('placementBoard.groups')}</span>
                <input type="text" value={draft.groups} onChange={(event) => setDraft({ ...draft, groups: event.target.value })} />
              </label>
              <p>{t('placementBoard.groupsHelp')}</p>
              <button type="submit">{t('optionsGrid.apply')}</button>
            </form>
          </Accordion>
        ) : null}
      </div>
    </section>
  );
}
