import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './StudentsAccordion.css';

const defaultGetRowKey = (participant, index) => participant.id || participant.sessionId || participant.username || participant.name || index;
const defaultGetDisplayName = (participant, fallbackName) => participant.username || participant.name || participant.displayName || fallbackName;
const defaultGetIsConnected = (participant) => participant && typeof participant.isConnected === 'boolean'
  ? participant.isConnected
  : participant && typeof participant.connected === 'boolean'
    ? participant.connected
    : true;

const hasTableConfiguration = ({ title, columns, headerGroups, emptyMessage, nameFallback, participants }) => (
  Boolean(title)
  || (Array.isArray(columns) && columns.length > 0)
  || (Array.isArray(headerGroups) && headerGroups.length > 0)
  || Boolean(emptyMessage)
  || Boolean(nameFallback)
  || participants !== undefined
);

export default function StudentsAccordion({
  title = '',
  open = false,
  nameColumnLabel = '',
  nameHeaderControl = null,
  onFeedbackChange,
  participants,
  columns,
  headerGroups,
  emptyMessage = '',
  nameFallback = '',
  getRowKey = defaultGetRowKey,
  getDisplayName = defaultGetDisplayName,
  getIsConnected = defaultGetIsConnected,
  getRowStyle,
  role = 'student',
  studentName = '',
  activity = '',
  currentScore = 0
}) {
  const { t } = useTranslation(['common', 'interface']);
  const sessionLogging = useSessionInputLogger();
  const [settingsSaving, setSettingsSaving] = useState(false);
  const isTeacher = role === 'teacher' || sessionLogging?.role === 'teacher';
  const resolvedRows = Array.isArray(participants) ? participants : [];
  const resolvedColumns = Array.isArray(columns) ? columns : [];
  const resolvedHeaderGroups = Array.isArray(headerGroups) ? headerGroups : [];
  const shouldRenderTable = hasTableConfiguration({
    title,
    columns: resolvedColumns,
    headerGroups: resolvedHeaderGroups,
    emptyMessage,
    nameFallback,
    participants
  });

  useEffect(() => {
    if (isTeacher || !studentName || !activity || !Number.isFinite(Number(currentScore))) return undefined;
    const timer = window.setTimeout(() => {
      fetch('/api/scores/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          activity,
          currentScore: Number(currentScore),
          sessionId: sessionLogging?.activeSessionId || ''
        })
      }).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activity, currentScore, isTeacher, sessionLogging?.activeSessionId, studentName]);

  if (!shouldRenderTable) return null;

  const rows = resolvedRows;
  const extraColumns = resolvedColumns;
  const safeHeaderGroups = resolvedHeaderGroups;
  const totalColumns = 1 + extraColumns.length;
  const groupedSpanTotal = safeHeaderGroups.reduce((sum, group) => sum + (group.colSpan || 1), 0);
  const resolvedTitle = title || t('studentTable', { ns: 'interface' });
  const resolvedEmptyMessage = emptyMessage || t('notAvailable');
  const resolvedFallback = nameFallback || t('student');

  async function updateFeedback(event) {
    const enabled = event.currentTarget.checked;
    const previous = Boolean(sessionLogging?.feedbackEnabled);
    setSettingsSaving(true);
    onFeedbackChange?.(enabled);
    try {
      await sessionLogging?.updateFeedbackEnabled?.(enabled);
    } catch {
      onFeedbackChange?.(previous);
    } finally {
      setSettingsSaving(false);
    }
  }

  async function updateScore(event) {
    setSettingsSaving(true);
    try {
      await sessionLogging?.updateScoreVisible?.(event.currentTarget.checked);
    } catch {
      // The session context restores the previous value when saving fails.
    } finally {
      setSettingsSaving(false);
    }
  }

  return (
    <Accordion title={resolvedTitle} icon="🗄️" open={open}>
      <div className="students-accordion__content">
        <table className="students-accordion__table">
          <thead>
            {safeHeaderGroups.length > 0 && (
              <tr>
                <th aria-hidden="true" style={{ border: 'none', background: 'transparent', padding: 0 }}></th>
                {safeHeaderGroups.map((group, index) => (
                  <th
                    key={group.key || group.label || index}
                    colSpan={group.colSpan || 1}
                    style={group.style}
                    className={group.className || ''}
                  >
                    {group.label}
                  </th>
                ))}
                {Array.from({ length: Math.max(0, extraColumns.length - groupedSpanTotal) }).map((_, index) => (
                  <th
                    key={`header-group-gap-${index}`}
                    aria-hidden="true"
                    style={{ border: 'none', background: 'transparent', padding: 0 }}
                  ></th>
                ))}
              </tr>
            )}
            <tr>
              <th>
                <div style={{ display: 'grid', justifyItems: 'start', gap: '0.35rem' }}>
                  <span>{nameColumnLabel || t('student')}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem 0.7rem' }}>
                    {isTeacher ? (
                      <>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'normal' }}>
                          <input type="checkbox" checked={sessionLogging?.scoreVisible !== false} disabled={settingsSaving} onChange={updateScore} />
                          <span>{t('showScoreToStudents', { ns: 'common' })}</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'normal' }}>
                          <input type="checkbox" checked={Boolean(sessionLogging?.feedbackEnabled)} disabled={settingsSaving} onChange={updateFeedback} />
                          <span>{t('enableFeedback', { ns: 'common' })}</span>
                        </label>
                      </>
                    ) : null}
                    {nameHeaderControl}
                  </div>
                </div>
              </th>
              {extraColumns.map((column, index) => (
                <th key={column.key || column.label || index}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={totalColumns} style={{ textAlign: 'center', opacity: 0.7 }}>
                  {resolvedEmptyMessage}
                </td>
              </tr>
            )}
            {rows.map((participant, index) => {
              const isConnected = getIsConnected(participant, index);
              const displayName = getDisplayName(participant, resolvedFallback, index);

              return (
                <tr key={getRowKey(participant, index)} style={typeof getRowStyle === 'function' ? getRowStyle(participant, index) : undefined}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span
                      className="green-dot"
                      title={isConnected ? t('connected') : t('disconnected')}
                      aria-label={isConnected ? t('connected') : t('disconnected')}
                      style={{
                        display: 'inline-block',
                        backgroundColor: isConnected ? '#22c55e' : '#9ca3af',
                        opacity: isConnected ? 1 : 0.85,
                        marginRight: '0.5rem'
                      }}
                    ></span>
                    {displayName}
                  </td>
                  {extraColumns.map((column, columnIndex) => (
                    <td
                      key={column.key || column.label || columnIndex}
                      className={column.className || ''}
                      style={column.style}
                    >
                      {typeof column.render === 'function'
                        ? column.render(participant, index)
                        : participant?.[column.field] ?? '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Accordion>
  );
}

export const createPlacementGroupColumns = (groups = [], items = [], getPlacement, showCorrectness = true) => (
  (Array.isArray(groups) ? groups : []).map((group) => ({
    key: `placement-group-${group.id}`,
    label: group.title || group.id,
    render: (student) => {
      const placedItems = (Array.isArray(items) ? items : [])
        .filter((item) => typeof getPlacement === 'function' && getPlacement(student, item) === group.id);
      if (placedItems.length === 0) return '—';

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.3rem 0.7rem', whiteSpace: 'normal' }}>
          {placedItems.map((item) => (
            <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              {typeof item.content === 'string' ? item.content : item.label || item.content?.label || item.id}
              {showCorrectness && item.correctGroupId ? (
                <strong style={{ color: item.correctGroupId === group.id ? '#15803d' : '#b91c1c' }}>
                  {item.correctGroupId === group.id ? '✓' : '✗'}
                </strong>
              ) : null}
            </span>
          ))}
        </div>
      );
    }
  }))
);

export const createNeuralLabColumns = ({ i1, i2, threshold = 5 }) => [
  {
    key: 'i1',
    label: 'i₁ (ρόδες)',
    render: () => <>{i1} <span className="icon-in-table">🛞</span></>
  },
  {
    key: 'w1',
    label: 'w₁',
    className: 'weight-value',
    style: { background: '#ef4444', color: 'white' },
    render: (student) => student.weights?.w1 ?? '-'
  },
  {
    key: 'i2',
    label: 'i₂ (μηχανές)',
    render: () => <>{i2} <span className="icon-in-table">⚙️</span></>
  },
  {
    key: 'w2',
    label: 'w₂',
    className: 'weight-value',
    style: { background: '#ef4444', color: 'white' },
    render: (student) => student.weights?.w2 ?? '-'
  },
  {
    key: 'result',
    label: 'Αποτέλεσμα o',
    className: 'result-visible',
    render: (student) => (
      <>
        {student.result ?? '-'}
        {typeof student.aboveThreshold === 'boolean' && (
          <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
            {student.aboveThreshold ? `>= ${threshold}` : `< ${threshold}`}
          </span>
        )}
      </>
    )
  }
];

export const createBuffonColumns = () => [
  {
    key: 'team',
    label: 'Ομάδα',
    render: (student) => student.team || student.name || '-'
  },
  {
    key: 'drops',
    label: 'Ρίψεις',
    render: (student) => Number.isFinite(Number(student.drops)) ? Number(student.drops) : 0
  },
  {
    key: 'hits',
    label: 'Επιτυχίες',
    render: (student) => Number.isFinite(Number(student.hits)) ? Number(student.hits) : 0
  },
  {
    key: 'piEst',
    label: 'π εκτίμηση',
    render: (student) => Number.isFinite(Number(student.piEst)) ? Number(student.piEst).toFixed(4) : '-'
  },
  {
    key: 'score',
    label: 'Σκορ',
    render: (student) => Number.isFinite(Number(student.score)) ? Number(student.score) : '-'
  }
];

export const createGeometryColumns = () => [
  {
    key: 'x',
    label: 'Θέση X',
    render: (student) => Number.isFinite(Number(student.x)) ? Number(student.x).toFixed(1) : '-'
  },
  {
    key: 'y',
    label: 'Θέση Y',
    render: (student) => Number.isFinite(Number(student.y)) ? Number(student.y).toFixed(1) : '-'
  },
  {
    key: 'role',
    label: 'Ρόλος',
    render: (student) => student.role || '-'
  },
  {
    key: 'shape',
    label: 'Σχήμα',
    render: (student) => student.shape || '-'
  }
];
