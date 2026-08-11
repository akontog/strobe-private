import React from 'react';

export default function ConnectionNameControl({
  connected = false,
  name = '',
  editing = false,
  value = '',
  onChange,
  onStartEdit,
  onCommit,
  onCancel,
  color = '#4ECDC4',
  showColorPicker = false,
  onColorChange,
  infoText = '',
  connectedLabel = 'Connected',
  disconnectedLabel = 'Disconnected',
  namePrefix = 'name',
  showNameLabel = true,
  className = ''
}) {
  const statusLabel = connected ? connectedLabel : disconnectedLabel;

  return (
    <div className={className}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '999px',
            background: connected ? '#22c55e' : '#9ca3af',
            display: 'inline-block'
          }}
        />
        <strong>{statusLabel}</strong>
        {showNameLabel && !editing && (
          <span>
            {namePrefix}: {name || '-'}
          </span>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange && onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && onCommit) onCommit();
              if (event.key === 'Escape' && onCancel) onCancel();
            }}
            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <button type="button" onClick={onCommit}>OK</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {typeof onStartEdit === 'function' && (
            <button type="button" onClick={onStartEdit}>Edit</button>
          )}
          {showColorPicker && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>Color</span>
              <input
                type="color"
                value={color}
                onChange={(event) => onColorChange && onColorChange(event.target.value)}
              />
            </label>
          )}
        </div>
      )}

      {infoText ? <div style={{ marginTop: 6, opacity: 0.8 }}>{infoText}</div> : null}
    </div>
  );
}
