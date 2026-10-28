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
  label: `Input ${index + 1}`,
  min: null,
  max: null,
  step: 1,
  correctAnswerType: 'exact',
  correctAnswer: '',
  correctAnswers: [],
  correctAnswerMin: '-inf',
  correctAnswerMax: 'inf',
  minInclusive: true,
  maxInclusive: true
}));
const defaultSettings = { rows: 2, columns: 2, applyToAll: false, applyProperties: ['min', 'max', 'step'], fields: createFields(2, 2) };

function isUnbounded(value, side) {
  const normalized = String(value || '').trim().toLowerCase().replace(/∞/g, 'inf').replace(/−/g, '-');
  return side === 'lower' ? ['-inf', '-infinity'].includes(normalized) : ['inf', '+inf', 'infinity', '+infinity'].includes(normalized);
}

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
  const [activeFieldId, setActiveFieldId] = useState('cell-1');

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
          const fields = (state.settings.fields || []).map((field, index) => ({
            ...createFields(1, 1)[0],
            ...field,
            correctAnswers: Array.isArray(field.correctAnswers) ? field.correctAnswers : [],
            id: field.id || `cell-${index + 1}`
          }));
          const nextSettings = { ...defaultSettings, ...state.settings, fields };
          setSettings(nextSettings);
          setDraft(nextSettings);
          setActiveFieldId((currentId) => fields.some((field) => field.id === currentId) ? currentId : fields[0]?.id || '');
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
    type: 'number',
    min: field.min ?? undefined,
    max: field.max ?? undefined,
    step: field.step || 1,
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
    const fields = createFields(rows, columns).map((field) => previous.get(field.id) || field);
    setDraft({ ...draft, rows, columns, fields });
    if (!fields.some((field) => field.id === activeFieldId)) setActiveFieldId(fields[0]?.id || '');
  }

  function updateField(fieldId, updates) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => field.id === fieldId ? { ...field, ...updates } : field)
    }));
  }

  function applySettings(event) {
    event.preventDefault();
    const sourceField = draft.fields.find((field) => field.id === activeFieldId);
    const settingsToApply = draft.applyToAll && sourceField
      ? {
        ...draft,
        fields: draft.fields.map((field) => field.id === activeFieldId ? field : {
          ...field,
        ...Object.fromEntries((draft.applyProperties || []).map((property) => [property, sourceField[property]]))
        })
      }
      : draft;
    socketRef.current?.emit('input-grid:settings', { roomId, settings: settingsToApply });
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
                <div className="input-grid-collab__field-tabs" role="tablist" aria-label={t('inputGrid.cells')}>
                  {draft.fields.map((field, index) => {
                    const row = Math.floor(index / draft.columns) + 1;
                    const column = (index % draft.columns) + 1;
                    const markerRow = Math.max(1, Math.min(3, Math.ceil((row / draft.rows) * 3)));
                    const markerColumn = Math.max(1, Math.min(3, Math.ceil((column / draft.columns) * 3)));
                    const exactMarker = draft.rows <= 3 && draft.columns <= 3;
                    return <button key={field.id} type="button" role="tab" aria-selected={activeFieldId === field.id} className={activeFieldId === field.id ? 'is-active' : ''} onClick={() => setActiveFieldId(field.id)}>
                      <span
                        className={`input-grid-collab__tab-position ${exactMarker ? 'is-exact' : 'is-approximate'}`}
                        aria-hidden="true"
                        style={exactMarker ? { gridTemplateColumns: `repeat(${draft.columns}, 1fr)`, gridTemplateRows: `repeat(${draft.rows}, 1fr)` } : undefined}
                      >
                        {exactMarker
                          ? draft.fields.map((cell, cellIndex) => <i key={cell.id} className={cellIndex === index ? 'is-selected' : ''} />)
                          : <i style={{ gridRow: markerRow, gridColumn: markerColumn }} />}
                      </span>
                      <span className="input-grid-collab__tab-text">
                        <strong>{field.label || t('inputGrid.fieldLabel', { number: index + 1 })}</strong>
                        <small>{t('inputGrid.cellPosition', { row, column })}</small>
                      </span>
                    </button>
                  })}
                </div>
                {draft.fields.filter((field) => field.id === activeFieldId).map((field) => (
                  <section className="input-grid-collab__field-properties" key={field.id} role="tabpanel">
                    <label><span>{t('inputGrid.fieldLabel', { number: draft.fields.findIndex((item) => item.id === field.id) + 1 })}</span><input type="text" value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} /></label>
                    <label><span>{t('inputGrid.minimum')}</span><input type="number" value={field.min ?? ''} onChange={(event) => updateField(field.id, { min: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                    <label><span>{t('inputGrid.maximum')}</span><input type="number" value={field.max ?? ''} onChange={(event) => updateField(field.id, { max: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                    <label><span>{t('inputGrid.step')}</span><input type="number" min="0.000001" step="any" value={field.step ?? 1} onChange={(event) => updateField(field.id, { step: Number(event.target.value) || 1 })} /></label>
                    <label><span>{t('inputGrid.correctAnswer')}</span><select value={field.correctAnswerType || 'exact'} onChange={(event) => updateField(field.id, { correctAnswerType: event.target.value })}>
                      <option value="exact">{t('inputGrid.answerExact')}</option>
                      <option value="minimum">{t('inputGrid.answerMinimum')}</option>
                      <option value="set">{t('inputGrid.answerSet')}</option>
                      <option value="interval">{t('inputGrid.answerInterval')}</option>
                    </select></label>
                    {field.correctAnswerType === 'interval' ? <div className="input-grid-collab__interval">
                      <label><span>{t('inputGrid.lowerBound')}</span><input type="text" value={field.correctAnswerMin ?? '-inf'} placeholder="-inf" onChange={(event) => updateField(field.id, { correctAnswerMin: event.target.value })} /></label>
                      <label><span>{t('inputGrid.upperBound')}</span><input type="text" value={field.correctAnswerMax ?? 'inf'} placeholder="inf" onChange={(event) => updateField(field.id, { correctAnswerMax: event.target.value })} /></label>
                      <label className="input-grid-collab__inclusive"><input type="checkbox" disabled={isUnbounded(field.correctAnswerMin, 'lower')} checked={!isUnbounded(field.correctAnswerMin, 'lower') && field.minInclusive !== false} onChange={(event) => updateField(field.id, { minInclusive: event.target.checked })} />{t('inputGrid.includeLowerBound')}</label>
                      <label className="input-grid-collab__inclusive"><input type="checkbox" disabled={isUnbounded(field.correctAnswerMax, 'upper')} checked={!isUnbounded(field.correctAnswerMax, 'upper') && field.maxInclusive !== false} onChange={(event) => updateField(field.id, { maxInclusive: event.target.checked })} />{t('inputGrid.includeUpperBound')}</label>
                      <p>{!isUnbounded(field.correctAnswerMin, 'lower') && field.minInclusive !== false ? '[' : '('}{field.correctAnswerMin || '-inf'}, {field.correctAnswerMax || 'inf'}{!isUnbounded(field.correctAnswerMax, 'upper') && field.maxInclusive !== false ? ']' : ')'}</p>
                    </div> : field.correctAnswerType === 'set'
                      ? <label className="input-grid-collab__answer-set"><span>{t('inputGrid.correctAnswers')}</span><input type="text" value={(field.correctAnswers || []).join(', ')} onChange={(event) => updateField(field.id, { correctAnswers: event.target.value.split(',').map((answer) => answer.trim()).filter(Boolean) })} /></label>
                      : <label><span>{field.correctAnswerType === 'minimum' ? '≥' : '='}</span><input type="number" value={field.correctAnswer ?? ''} onChange={(event) => updateField(field.id, { correctAnswer: event.target.value === '' ? '' : Number(event.target.value) })} /></label>}
                  </section>
                ))}
                <label className="input-grid-collab__apply-all">
                  <input type="checkbox" checked={draft.applyToAll} onChange={(event) => setDraft({ ...draft, applyToAll: event.target.checked })} />
                  <span className="input-grid-collab__switch" aria-hidden="true" />
                  <span>{t('inputGrid.applyToAll')}</span>
                </label>
                {draft.applyToAll ? <fieldset className="input-grid-collab__apply-properties">
                  <legend>{t('inputGrid.applyPropertiesLegend')}</legend>
                  {['min', 'max', 'step', 'correctAnswerType', 'correctAnswer', 'correctAnswers', 'correctAnswerMin', 'correctAnswerMax', 'minInclusive', 'maxInclusive'].map((property) => (
                    <label key={property}><input type="checkbox" checked={(draft.applyProperties || []).includes(property)} onChange={(event) => setDraft({ ...draft, applyProperties: event.target.checked ? [...(draft.applyProperties || []), property] : (draft.applyProperties || []).filter((item) => item !== property) })} />{t(`inputGrid.apply.${property}`)}</label>
                  ))}
                </fieldset> : null}
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
