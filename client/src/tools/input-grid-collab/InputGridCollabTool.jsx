import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivitySettingsAccordion, EntryGrid, SettingsAccordion } from '../../shared/components';
import { readIdentityName } from '../../shared/components/menu/identityStorage';
import './InputGridCollabTool.css';

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

const createFields = (rows, columns) => Array.from({ length: rows * columns }, (_, index) => ({
  id: `cell-${index + 1}`,
  label: `Input ${index + 1}`
}));
const defaultSettings = { rows: 2, columns: 2, min: null, max: null, step: 1, applyToAll: true, fields: createFields(2, 2) };

/** Opens a collaborative input grid with teacher-controlled classroom settings. */
export default function InputGridCollabTool({ role = 'student' }) {
  const { t: tNav } = useTranslation('navigation');
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'input-grid-default';
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const socketRef = useRef(null);
  const answersRef = useRef({});
  const [settings, setSettings] = useState(defaultSettings);
  const [draft, setDraft] = useState(defaultSettings);
  const [responses, setResponses] = useState({});
  const [myAnswers, setMyAnswers] = useState({});

  useEffect(() => {
    let cancelled = false;
    let socket;
    loadRealtimeSocket().then(() => {
      if (cancelled) return;
      socket = window.createRealtimeSocket({ path: '/ws/realtime' });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('input-grid:join', { roomId }));
      socket.on('input-grid:state', (state) => {
        if (state?.roomId !== `input-grid-${roomId}`) return;
        const ownAnswers = state.clearAnswers ? {} : state.ownAnswers || answersRef.current;
        answersRef.current = ownAnswers;
        setMyAnswers(ownAnswers);
        if (state.settings) {
          setSettings(state.settings);
          setDraft(state.settings);
        }
      });
      socket.on('input-grid:own-answer', (state) => {
        if (state?.roomId === `input-grid-${roomId}`) {
          answersRef.current = state.answers || {};
          setMyAnswers(answersRef.current);
        }
      });
      socket.on('input-grid:responses', (state) => {
        if (state?.roomId === `input-grid-${roomId}`) setResponses(state.answers || {});
      });
      socket.connect();
    }).catch(() => {});
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const fields = settings.fields.map((field) => ({
    ...field,
    value: myAnswers[field.id] || '',
    type: settings.applyToAll ? 'number' : 'text',
    min: settings.applyToAll ? settings.min ?? undefined : undefined,
    max: settings.applyToAll ? settings.max ?? undefined : undefined,
    step: settings.applyToAll ? settings.step : undefined,
    onChange: (value) => updateAnswer(field.id, value)
  }));

  function updateAnswer(fieldId, value) {
    const answers = { ...answersRef.current, [fieldId]: value };
    answersRef.current = answers;
    setMyAnswers(answers);
    socketRef.current?.emit('input-grid:answers', {
      roomId,
      answers,
      name: readIdentityName('Student'),
      sessionApp: 'input-grid-collab'
    });
  }

  function updateDimensions(key, rawValue) {
    const rows = key === 'rows' ? Math.max(1, Math.min(20, Number(rawValue) || 1)) : draft.rows;
    const columns = key === 'columns' ? Math.max(1, Math.min(20, Number(rawValue) || 1)) : draft.columns;
    const previous = new Map(draft.fields.map((field) => [field.id, field]));
    setDraft({ ...draft, rows, columns, fields: createFields(rows, columns).map((field) => previous.get(field.id) || field) });
  }

  function applySettings(event) {
    event.preventDefault();
    socketRef.current?.emit('input-grid:settings', { roomId, settings: draft });
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="input-grid-collab" roomId={roomId} role={role} defaultTitle={tNav('items.inputGrid')} config={settings}>
          <EntryGrid
                fields={fields}
                rows={settings.rows}
                columns={settings.columns}
                activity="input-grid-collaboration"
              />
        </ActivitySettingsAccordion>
        {isTeacher ? (
          <>
            <SettingsAccordion title="activityResourceSettings" icon="🔢">
              <form className="input-grid-collab__settings" onSubmit={applySettings}>
                <label><span>{t('activityBuilder.rows')}</span><input type="number" min="1" max="20" value={draft.rows} onChange={(event) => updateDimensions('rows', event.target.value)} /></label>
                <label><span>{t('activityBuilder.columns')}</span><input type="number" min="1" max="20" value={draft.columns} onChange={(event) => updateDimensions('columns', event.target.value)} /></label>
                <div className="input-grid-collab__field-labels">
                  {draft.fields.map((field, index) => (
                    <label key={field.id}>
                      <span>{t('inputGrid.fieldLabel', { number: index + 1 })}</span>
                      <input type="text" value={field.label} onChange={(event) => setDraft({ ...draft, fields: draft.fields.map((item) => item.id === field.id ? { ...item, label: event.target.value } : item) })} />
                    </label>
                  ))}
                </div>
                <label><span>{t('inputGrid.minimum')}</span><input type="number" value={draft.min ?? ''} onChange={(event) => setDraft({ ...draft, min: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                <label><span>{t('inputGrid.maximum')}</span><input type="number" value={draft.max ?? ''} onChange={(event) => setDraft({ ...draft, max: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                <label><span>{t('inputGrid.step')}</span><input type="number" min="0.000001" step="any" value={draft.step} onChange={(event) => setDraft({ ...draft, step: Number(event.target.value) || 1 })} /></label>
                <label className="input-grid-collab__apply-all"><input type="checkbox" checked={draft.applyToAll} onChange={(event) => setDraft({ ...draft, applyToAll: event.target.checked })} />{t('inputGrid.applyToAll')}</label>
                <button type="submit">{t('optionsGrid.apply')}</button>
              </form>
            </SettingsAccordion>
            <section className="input-grid-collab__responses">
              <h2>{t('inputGrid.responses')}</h2>
              {Object.values(responses).length ? Object.values(responses).map((response, index) => (
                <article key={`${response.name}-${index}`}>
                  <h3>{response.name}</h3>
                  <dl>{settings.fields.map((field) => <React.Fragment key={field.id}><dt>{field.label}</dt><dd>{response.answers[field.id] || '—'}</dd></React.Fragment>)}</dl>
                </article>
              )) : <p>{t('inputGrid.noResponses')}</p>}
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}
