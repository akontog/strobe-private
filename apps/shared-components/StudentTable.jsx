import React from 'react';
import { Accordion } from './Accordion';

const defaultGetRowKey = (participant, index) => participant.id || participant.sessionId || participant.username || participant.name || index;
const defaultGetDisplayName = (participant, fallbackName) => participant.username || participant.name || participant.displayName || fallbackName;
const defaultGetIsConnected = (participant) => participant && typeof participant.isConnected === 'boolean'
  ? participant.isConnected
  : participant && typeof participant.connected === 'boolean'
    ? participant.connected
    : true;

export const StudentTable = ({
  title = '📋 Πίνακας χρηστών',
  participants = [],
  columns = [],
  emptyMessage = 'Δεν υπάρχουν συνδεδεμένοι χρήστες.',
  nameFallback = 'Χρήστης',
  getRowKey = defaultGetRowKey,
  getDisplayName = defaultGetDisplayName,
  getIsConnected = defaultGetIsConnected
}) => {
  const rows = Array.isArray(participants) ? participants : [];
  const extraColumns = Array.isArray(columns) ? columns : [];
  const totalColumns = 2 + extraColumns.length;

  return (
    <Accordion title={title}>
      <div className="data-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Κατάσταση</th>
              <th>Όνομα χρήστη</th>
              {extraColumns.map((column, index) => (
                <th key={column.key || column.label || index}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={totalColumns} style={{ textAlign: 'center', opacity: 0.7 }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((participant, index) => {
              const isConnected = getIsConnected(participant, index);
              const displayName = getDisplayName(participant, nameFallback, index);

              return (
                <tr key={getRowKey(participant, index)}>
                  <td>
                    <span
                      className="green-dot"
                      style={{
                        display: 'inline-block',
                        backgroundColor: isConnected ? '#22c55e' : '#9ca3af',
                        opacity: isConnected ? 1 : 0.85
                      }}
                    ></span>{' '}
                    {isConnected ? 'Συνδεδεμένος' : 'Αποσυνδεδεμένος'}
                  </td>
                  <td>{displayName}</td>
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
};
