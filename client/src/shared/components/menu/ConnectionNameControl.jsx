import React from 'react';

export default function ConnectionNameControl({
  connected = false, // Shows the connected or disconnected state.
  name = '', // Current displayed name.
  editing = false, // Shows the name input when true.
  value = '', // Draft name while editing.
  onChange, // Handles draft name changes.
  onStartEdit, // Starts editing the name.
  onCommit, // Saves the edited name.
  onCancel, // Cancels name editing.
  color = '#4ECDC4', // Current identity color.
  showColorPicker = false, // Shows the color picker when true.
  onColorChange, // Handles identity color changes.
  infoText = '', // Optional explanatory text.
  connectedLabel = 'Connected', // Label shown when connected.
  disconnectedLabel = 'Disconnected', // Label shown when disconnected.
  namePrefix = 'name', // Prefix used for accessible name labels.
  showNameLabel = true, // Shows the name label when true.
  className = '' // Additional CSS classes for the control.
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
