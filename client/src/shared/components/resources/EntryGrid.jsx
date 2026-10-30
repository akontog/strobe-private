import React from 'react';
import SharedInputBox from '../primitives/SharedInputBox';
import MathFormula from '../primitives/MathFormula';
import './EntryGrid.css';

function renderField(field, index, labelClassName, activity, keyPrefix = '') {
  const key = `${keyPrefix}${field.id || field.key || `field-${index}`}`;
  const fieldClassName = ['activity-input-grid__cell', field.className, field.invalid ? 'is-invalid' : ''].filter(Boolean).join(' ');
  const cellStyle = field.row && field.column
    ? { gridRow: Number(field.row), gridColumn: Number(field.column) }
    : undefined;

  if (field.kind === 'choice-grid') {
    const min = Number(field.min);
    const max = Number(field.max);
    const step = Number(field.step);
    const count = Number.isFinite(min) && Number.isFinite(max) && step > 0
      ? Math.floor((max - min) / step + 1e-9) + 1
      : 0;
    const choices = Array.isArray(field.options) ? field.options : Array.from({ length: count }, (_, optionIndex) => {
      const value = Number((min + optionIndex * step).toPrecision(12));
      return { value, label: field.optionLabels?.[optionIndex] ?? String(value) };
    });
    return (
      <div key={key} className={fieldClassName}>
        {field.label ? <span className={labelClassName}>{field.label}</span> : null}
        <div className="activity-choice-grid" role="group" aria-label={field.ariaLabel || field.label || key}
          style={{ gridTemplateColumns: `repeat(${Math.max(1, Number(field.columns) || 1)}, minmax(0, 1fr))` }}>
          {choices.map((choice, optionIndex) => {
            const option = typeof choice === 'object' ? choice : { value: choice, label: field.optionLabels?.[optionIndex] ?? String(choice) };
            const selected = String(field.value ?? '') === String(option.value);
            return <button key={`${key}-${optionIndex}`} type="button" className={`activity-choice-grid__option${selected ? ' is-selected' : ''}`}
              aria-pressed={selected} onClick={() => field.onChange?.(option.value)}>{option.label}</button>;
          })}
        </div>
      </div>
    );
  }

  if (field.kind === 'token') {
    return <span key={key} className={fieldClassName} style={cellStyle} aria-hidden={field.ariaHidden ?? true}>{field.value}</span>;
  }
  if (field.kind === 'output' || field.editable === false) {
    return (
      <div key={key} className={fieldClassName} style={cellStyle}>
        {field.label ? <span className={labelClassName}>{field.label}</span> : null}
        <div className={field.displayClassName || 'activity-input-grid__output'}>{field.value ?? field.fallback ?? '-'}</div>
      </div>
    );
  }
  return (
    <SharedInputBox key={key} id={field.id || field.key || key}
      label={field.label || field.ariaLabel || ''} ariaLabel={field.ariaLabel || ''}
      value={field.value === null || field.value === undefined ? '' : String(field.value)}
      onChange={(event) => field.onChange?.(event.target.value, event)} placeholder={field.placeholder || ''}
      showLabel={Boolean(field.label)} type={field.type || 'text'} className={fieldClassName}
      inputClassName={field.inputClassName || 'activity-input-grid__input'} labelClassName={labelClassName}
      disabled={Boolean(field.disabled)} activity={activity} step={field.step} min={field.min} max={field.max}
      allowIntegers={field.allowIntegers ?? true} allowDecimals={field.allowDecimals ?? true} />
  );
}

/** Renders configurable input, choice, and display cells for reusable activities. */
export default function EntryGrid({
  fields = [],
  groups = [],
  columnLabels = [],
  columns = 2,
  rows,
  activity = '',
  className = '',
  customLayout = false,
  labelClassName = 'activity-input-grid__label'
}) {
  const gridClassName = customLayout ? className : ['activity-input-grid', className].filter(Boolean).join(' ');
  const gridStyle = customLayout ? undefined : {
    gridTemplateColumns: `repeat(${Math.max(1, Number(columns) || 1)}, minmax(0, 1fr))`,
    ...(rows ? { gridTemplateRows: `repeat(${Math.max(1, Number(rows) || 1)}, auto)` } : {})
  };

  return (
    <div className={gridClassName} style={gridStyle}>
      {groups.length ? groups.map((group, groupIndex) => {
        const groupColumns = Math.max(1, Number(group.columns || columns) || 1);
        return (
          <fieldset key={group.id || `group-${groupIndex}`} className="activity-input-grid__group">
            {group.legend ? <legend>{group.legendFormat === 'mathjax' ? <MathFormula formula={group.legend} /> : group.legend}</legend> : null}
            {columnLabels.length ? <div className="activity-input-grid__column-labels" style={{ gridTemplateColumns: `repeat(${groupColumns}, minmax(0, 1fr))` }}>
              {columnLabels.map((label, labelIndex) => <span key={`${groupIndex}-label-${labelIndex}`}>{label}</span>)}
            </div> : null}
            <div className="activity-input-grid__group-fields" style={{ gridTemplateColumns: `repeat(${groupColumns}, minmax(0, 1fr))` }}>
              {(group.fields || []).map((field, index) => renderField(field, index, labelClassName, activity, `${group.id || groupIndex}-`))}
            </div>
          </fieldset>
        );
      }) : fields.map((field, index) => renderField(field, index, labelClassName, activity))}
    </div>
  );
}
