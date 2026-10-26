import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivitySettingsAccordion, parseOptionsExpression, SettingsAccordion, VennBoard, useSessionInputLogger } from '../../shared/components';
import { requestRealtimeAck } from '../../shared/utils/realtimeAck';
import './VennCollabTool.css';

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

const defaultSettings = {
  sets: [{ id: 'set-a', title: 'A' }, { id: 'set-b', title: 'B' }],
  relations: [{ first: 'set-a', second: 'set-b', relation: 'intersecting' }],
  elements: '1:20'
};

function createRelations(sets, previous = []) {
  const existing = new Map(previous.map((item) => [`${item.first}:${item.second}`, item.relation]));
  return sets.flatMap((set, index) => sets.slice(index + 1).map((other) => ({
    first: set.id,
    second: other.id,
    relation: existing.get(`${set.id}:${other.id}`) || 'intersecting'
  })));
}

/** Opens a live Venn board for the current classroom. */
export default function VennCollabTool({ role = 'student' }) {
  const { t: tNav } = useTranslation('navigation');
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'venn-default';
  const session = useSessionInputLogger();
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const socketRef = useRef(null);
  const [placements, setPlacements] = useState({});
  const [settings, setSettings] = useState(defaultSettings);
  const [draft, setDraft] = useState(defaultSettings);

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('venn:join', { roomId }));
      socket.on('venn:state', (state) => {
        if (state?.roomId !== `venn-${roomId}`) return;
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

  const sets = settings.sets.map((set) => ({
    ...set,
    subsetOf: settings.relations.find((relation) => relation.relation === 'subset' && relation.first === set.id)?.second
  }));
  const items = parseOptionsExpression(settings.elements).slice(0, 100).map((item) => ({ id: item.id, content: item.label }));

  function updateSetCount(count) {
    const nextSets = Array.from({ length: count }, (_, index) => draft.sets[index] || {
      id: `set-${String.fromCharCode(97 + index)}`,
      title: String.fromCharCode(65 + index)
    });
    setDraft({ ...draft, sets: nextSets, relations: createRelations(nextSets, draft.relations) });
  }

  function applySettings(event) {
    event.preventDefault();
    socketRef.current?.emit('venn:settings', { roomId, settings: draft });
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="venn-collab" roomId={roomId} role={role} defaultTitle={tNav('items.venn')} config={{ sets: settings.sets, relations: settings.relations, elements: settings.elements }}>
              <VennBoard
                items={items}
                sets={sets}
                diagram={{ sets, relations: settings.relations }}
                placements={placements}
                onChange={(nextPlacements) => {
                  setPlacements(nextPlacements);
                  socketRef.current?.emit('venn:placements', { roomId, placements: nextPlacements, sessionApp: 'geogebra-collab' });
                }}
                activity="venn-board-collaboration"
                bankLabel=""
              />
        </ActivitySettingsAccordion>
        {isTeacher ? (
          <SettingsAccordion title="activityResourceSettings" icon="⭕">
            <form className="venn-collab-settings" onSubmit={applySettings}>
              <label>
                <span>{t('vennCollab.setCount')}</span>
                <select value={draft.sets.length} onChange={(event) => updateSetCount(Number(event.target.value))}>
                  {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
              </label>
              {draft.sets.map((set, index) => (
                <label key={set.id}>
                  <span>{t('vennCollab.setName', { number: index + 1 })}</span>
                  <input
                    type="text"
                    maxLength="24"
                    value={set.title}
                    onChange={(event) => setDraft({ ...draft, sets: draft.sets.map((item) => item.id === set.id ? { ...item, title: event.target.value } : item) })}
                  />
                </label>
              ))}
              {draft.relations.map((relation) => (
                <label key={`${relation.first}-${relation.second}`}>
                  <span>{t('vennCollab.relationBetween', {
                    first: draft.sets.find((set) => set.id === relation.first)?.title,
                    second: draft.sets.find((set) => set.id === relation.second)?.title
                  })}</span>
                  <select
                    value={relation.relation}
                    onChange={(event) => setDraft({ ...draft, relations: draft.relations.map((item) => item === relation ? { ...item, relation: event.target.value } : item) })}
                  >
                    <option value="disjoint">{t('vennCollab.relations.disjoint')}</option>
                    <option value="intersecting">{t('vennCollab.relations.intersecting')}</option>
                    <option value="subset">{t('vennCollab.relations.subset')}</option>
                  </select>
                </label>
              ))}
              <label>
                <span>{t('vennCollab.elements')}</span>
                <input type="text" value={draft.elements} onChange={(event) => setDraft({ ...draft, elements: event.target.value })} />
              </label>
              <p>{t('activityBuilder.optionsExpressionHelp')}</p>
              <button type="submit">{t('optionsGrid.apply')}</button>
            </form>
          </SettingsAccordion>
        ) : null}
      </div>
    </section>
  );
}
