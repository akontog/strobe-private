import React from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './shared-inputs.css';

export default function SharedInputBox({
  label = '',
  value,
  onChange,
  placeholder = '',
  showLabel = true,
  type = 'text',
  className = 'lab-field poly-team-field',
  inputClassName = '',
  labelClassName = '',
  disabled = false,
  activity = '',
  id,
  autoComplete = 'off'
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
