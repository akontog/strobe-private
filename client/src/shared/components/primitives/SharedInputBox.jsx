import React from 'react';
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
  id,
  autoComplete = 'off'
}) {
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
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </label>
  );
}
