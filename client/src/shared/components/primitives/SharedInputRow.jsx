import React from 'react';
import SharedInputBox from './SharedInputBox';
import './SharedInputRow.css';

export default function SharedInputRow({
  rowLabel = '', // Optional caption shown before the input row.
  boxes = [], // Input definitions rendered in the row.
  tokens = [], // Optional separators placed between inputs.
  className = '', // Additional CSS classes for the row.
  rowLabelClassName = '', // Additional CSS classes for the row caption.
  defaultLabel = '', // Label used when an input has no label.
  defaultPlaceholder = '', // Placeholder used when an input has none.
  hideLabels = false, // Hides input labels unless explicitly overridden.
  activity = '' // Activity identifier used in input logs.
}) {
  const wrapperClassName = ['shared-input-row', className].filter(Boolean).join(' ');
  const rowLabelClasses = ['shared-input-row__label', rowLabelClassName].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName}>
      {rowLabel ? <span className={rowLabelClasses}>{rowLabel}</span> : null}
      {boxes.map((box, index) => (
        <React.Fragment key={box.id || box.key || `box-${index}`}>
          <SharedInputBox
            label={box.label ?? defaultLabel}
            value={box.value}
            onChange={box.onChange}
            placeholder={box.placeholder ?? defaultPlaceholder}
            showLabel={box.showLabel ?? !hideLabels}
            type={box.type || 'text'}
            className={['shared-input-row__field', box.className || 'lab-field poly-team-field'].filter(Boolean).join(' ')}
            inputClassName={box.inputClassName || ''}
            labelClassName={box.labelClassName || ''}
            disabled={Boolean(box.disabled)}
            activity={activity}
            id={box.id}
            autoComplete={box.autoComplete || 'off'}
          />
          {tokens[index] ? <span className="shared-input-row__token">{tokens[index]}</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
