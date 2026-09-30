import React from 'react';
import SharedInputBox from './SharedInputBox';
import './shared-inputs.css';

export default function SharedInputRow({
  rowLabel = '',
  boxes = [],
  tokens = [],
  className = '',
  rowLabelClassName = '',
  defaultLabel = '',
  defaultPlaceholder = '',
  hideLabels = false
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
            id={box.id}
            autoComplete={box.autoComplete || 'off'}
          />

          {tokens[index] ? <span className="shared-input-row__token">{tokens[index]}</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
