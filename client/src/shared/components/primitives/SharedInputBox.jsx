import React from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './SharedInputBox.css';

const MINUS_KEY = '\u2212';
const DELETE_KEY = '\u232b';
const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', MINUS_KEY, '0', DELETE_KEY];

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
  ariaLabel = '',
  autoComplete = 'off',
  min,
  max,
  step,
  allowIntegers = true,
  allowDecimals = true
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const [isKeypadOpen, setIsKeypadOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);
  const effectiveId = id || React.useId();
  const isDisabled = disabled || !canEdit;

  React.useEffect(() => {
    const clearOnSessionStart = (event) => {
      if (event.detail?.clear && canEdit) onChange?.({ target: { value: '' } });
    };
    window.addEventListener('strobe:session-starting', clearOnSessionStart);
    return () => window.removeEventListener('strobe:session-starting', clearOnSessionStart);
  }, [canEdit, onChange]);

  React.useEffect(() => {
    if (isDisabled) setIsKeypadOpen(false);
  }, [isDisabled]);

  React.useEffect(() => {
    if (!isKeypadOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsKeypadOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isKeypadOpen]);

  const wrapperClassName = ['shared-input-box', className].filter(Boolean).join(' ');
  const finalInputClassName = ['shared-input-box__input', inputClassName].filter(Boolean).join(' ');
  const finalLabelClassName = ['shared-input-box__label', labelClassName].filter(Boolean).join(' ');

  const updateValue = (nextValue) => {
    const event = { target: { value: nextValue } };
    onChange?.(event);
    sessionLogging?.logEvent('activity.input.changed', activity, {
      field: String(id || label || 'input'),
      value: nextValue
    });
  };

  const handleKey = (key) => {
    const currentValue = String(value ?? '');
    let nextValue;
    if (key === DELETE_KEY) nextValue = currentValue.slice(0, -1);
    else if (key === MINUS_KEY) nextValue = currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`;
    else nextValue = `${currentValue}${key}`;

    const decimalSeparator = nextValue.includes(',') ? ',' : '.';
    const decimalCount = (nextValue.match(/[.,]/g) || []).length;
    if (nextValue && !/^-?\d*[.,]?\d*$/.test(nextValue)) return;
    if (decimalCount > 1 || (decimalSeparator && !allowDecimals && /[.,]/.test(nextValue))) return;
    if (!allowIntegers && !allowDecimals && nextValue !== '') return;

    const numericValue = Number(nextValue.replace(',', '.'));
    if (nextValue !== '' && nextValue !== '-' && nextValue !== '.' && nextValue !== ',' && Number.isFinite(numericValue)) {
      if (min !== undefined && numericValue < Number(min)) return;
      if (max !== undefined && numericValue > Number(max)) return;
    }
    updateValue(nextValue);
  };

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      {showLabel && label ? <label className={finalLabelClassName} htmlFor={effectiveId}>{label}</label> : null}
      <input
        id={effectiveId}
        className={finalInputClassName}
        type={type}
        aria-label={ariaLabel || undefined}
        value={value}
        onFocus={() => setIsKeypadOpen(!isDisabled)}
        onClick={() => { if (!isDisabled) setIsKeypadOpen(true); }}
        onChange={(event) => {
          onChange?.(event);
          sessionLogging?.logEvent('activity.input.changed', activity, {
            field: String(id || label || 'input'),
            value: event.target.value
          });
        }}
        placeholder={placeholder}
        disabled={isDisabled}
        autoComplete={autoComplete}
        inputMode="decimal"
        step={step}
        aria-haspopup="dialog"
        aria-expanded={isKeypadOpen}
      />
      {isKeypadOpen && !isDisabled ? (
        <div className="shared-input-box__keypad" role="group" aria-label={`${label || 'Input'} numeric keypad`}>
          {KEYS.filter((key) => (key !== MINUS_KEY || (min === undefined || Number(min) < 0)) && (key !== DELETE_KEY || String(value ?? '') !== '')).map((key) => (
            <button
              key={key}
              type="button"
              className="shared-input-box__key"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleKey(key)}
              aria-label={key === DELETE_KEY ? 'Delete last digit' : key === MINUS_KEY ? 'Toggle minus' : key}
            >
              {key}
            </button>
          ))}
          {allowDecimals ? (
            <button type="button" className="shared-input-box__key" onMouseDown={(event) => event.preventDefault()} onClick={() => handleKey('.')} aria-label="Decimal point">.</button>
          ) : null}
          <button type="button" className="shared-input-box__key shared-input-box__key--done" onClick={() => setIsKeypadOpen(false)}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
