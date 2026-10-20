import React from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './SharedInputBox.css';

export default function SharedInputBox({
  label = '', // Text shown above the input.
  value, // Current input value.
  onChange, // Handles input changes.
  placeholder = '', // Hint shown while the input is empty.
  showLabel = true, // Controls whether the label is visible.
  type = 'text', // Native input type.
  className = 'lab-field poly-team-field', // CSS classes for the input wrapper.
  inputClassName = '', // Additional CSS classes for the input.
  labelClassName = '', // Additional CSS classes for the label.
  disabled = false, // Disables input editing.
  activity = '', // Activity identifier used in input logs.
  id, // Input element identifier.
  autoComplete = 'off' // Browser autocomplete setting.
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const wrapperClassName = ['shared-input-box', className].filter(Boolean).join(' ');
  const finalInputClassName = ['shared-input-box__input', inputClassName].filter(Boolean).join(' ');
  const finalLabelClassName = ['shared-input-box__label', labelClassName].filter(Boolean).join(' ');

  return (
    <label className={wrapperClassName} htmlFor={id}>
      {showLabel && label ? <span className={finalLabelClassName}>{label}</span> : null}
      <input
        id={id}
        className={finalInputClassName}
        type={type}
        value={value}
        onChange={(event) => {
          onChange?.(event);
          sessionLogging?.logEvent('activity.input.changed', activity, {
            field: String(id || label || 'input'),
            value: event.target.value
          });
        }}
        placeholder={placeholder}
        disabled={disabled || !canEdit}
        autoComplete={autoComplete}
      />
    </label>
  );
}
