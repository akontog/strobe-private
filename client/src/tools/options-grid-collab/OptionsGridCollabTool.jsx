import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, GridButton, OptionsGrid, parseOptionsExpression } from '../../shared/components';
import './OptionsGridCollabTool.css';
import { readIdentitySnapshot } from '../../shared/components/menu/identityStorage';

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

const defaultSettings = { options: '1:12', rows: 3, columns: 4 };

/** Opens a shared choice grid with teacher-controlled room settings. */
export default function OptionsGridCollabTool({ role = 'student' }) {
  const { t: tNav } = useTranslation('navigation');
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'options-grid-default';
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const socketRef = useRef(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [draft, setDraft] = useState(defaultSettings);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('options-grid:join', { roomId }));
      socket.on('options-grid:state', (state) => {
        if (state?.roomId !== `options-grid-${roomId}`) return;
        if (state.settings) {
          setSettings(state.settings);
          setDraft(state.settings);
        }
        setSelections(state.selections || {});
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const options = parseOptionsExpression(settings.options).slice(0, settings.rows * settings.columns);
  const selectedOption = selections[socketRef.current?.id]?.optionId || '';
  const colorsByOption = Object.values(selections).reduce((colors, selection) => {
    if (!colors[selection.optionId]) colors[selection.optionId] = [];
    if (selection.color && !colors[selection.optionId].includes(selection.color)) colors[selection.optionId].push(selection.color);
    return colors;
  }, {});
  function applySettings(event) {
    event.preventDefault();
    socketRef.current?.emit('options-grid:settings', { roomId, settings: draft });
  }

  function selectOption(optionId) {
    const identity = readIdentitySnapshot({ nameFallback: 'Student' });
    socketRef.current?.emit('options-grid:select', {
      roomId,
      optionId: selectedOption === optionId ? '' : optionId,
      name: identity.name,
      color: identity.color,
      sessionApp: 'options-grid-collab'
    });
  }

  function colorStyle(optionId) {
    const colors = colorsByOption[optionId] || [];
    if (colors.length === 1) return { backgroundColor: colors[0] };
    if (colors.length > 1) {
      const step = 100 / colors.length;
      const stops = colors.flatMap((color, index) => [`${color} ${index * step}%`, `${color} ${(index + 1) * step}%`]);
      return { background: `conic-gradient(${stops.join(', ')})` };
    }
    return undefined;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="options-grid-collab" roomId={roomId} role={role} defaultTitle={tNav('items.optionsGrid')} config={settings}>
              <OptionsGrid
                items={options}
                rows={settings.rows}
                columns={settings.columns}
                ariaLabel={t('optionsGrid.ariaLabel')}
                className="options-grid-collab"
                renderItem={(option) => (
                  <GridButton key={option.id} style={colorStyle(option.id)} pressed={selectedOption === option.id} onClick={() => selectOption(option.id)}>
                    {option.label}
                  </GridButton>
                )}
              />
        </ActivitySettingsAccordion>
        {isTeacher ? (
          <Accordion title={t('activityResourceSettings', { ns: 'common' })} icon="🔘">
            <form className="options-grid-collab__settings" onSubmit={applySettings}>
              <label>
                <span>{t('activityBuilder.rows')}</span>
                <input type="number" min="1" max="20" value={draft.rows} onChange={(event) => setDraft({ ...draft, rows: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} />
              </label>
              <label>
                <span>{t('activityBuilder.columns')}</span>
                <input type="number" min="1" max="20" value={draft.columns} onChange={(event) => setDraft({ ...draft, columns: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} />
              </label>
              <label>
                <span>{t('activityBuilder.options')}</span>
                <input type="text" value={draft.options} onChange={(event) => setDraft({ ...draft, options: event.target.value })} />
              </label>
              <p>{t('activityBuilder.optionsExpressionHelp')}</p>
              <button type="submit">{t('optionsGrid.apply')}</button>
            </form>
          </Accordion>
        ) : null}
      </div>
    </section>
  );
}
