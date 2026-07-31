import React from 'react';

const ConnectionNameControl = ({
  connected = true,
  name,
  editing = false,
  value = '',
  onChange,
  onStartEdit,
  onCommit,
  onCancel,
  color = '#3b82f6',
  showColorPicker = false,
  onColorChange,
  infoText = '',
  connectedLabel = 'Σε σύνδεση',
  disconnectedLabel = 'Εκτός σύνδεσης',
  namePrefix = 'όνομα χρήστη',
  showNameLabel = true,
  className = ''
}) => {
  return (
    <div className={`connection-name-control ${className}`.trim()}>
      <span className={`connection-name-control__dot ${connected ? 'online' : 'offline'}`} />
      <strong className="connection-name-control__status">{connected ? connectedLabel : disconnectedLabel}</strong>
      {(showNameLabel || showColorPicker) ? (
        <div className="connection-name-control__row">
          {editing ? (
            <input
              autoFocus
              className="connection-name-control__input"
              value={value}
              onChange={(event) => onChange?.(event.target.value)}
              onBlur={onCommit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onCommit?.();
                }
                if (event.key === 'Escape') {
                  onCancel?.();
                }
              }}
            />
          ) : showNameLabel ? (
            <button type="button" className="connection-name-control__name" onClick={onStartEdit}>
              {namePrefix}: {name || '—'}
            </button>
          ) : null}

          {showColorPicker ? (
            <label className="connection-name-control__color-wrap" title="Επιλογή χρώματος">
              <input
                type="color"
                className="connection-name-control__color"
                value={color}
                onChange={(event) => onColorChange?.(event.target.value)}
                aria-label="Επιλογή χρώματος"
              />
            </label>
          ) : null}
        </div>
      ) : null}
      {infoText ? <span className="connection-name-control__info">{infoText}</span> : null}
    </div>
  );
};

export default ConnectionNameControl;
