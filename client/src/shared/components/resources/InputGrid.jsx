import React from 'react';
import './InputGrid.css';
import { useSessionInputLogger } from '../activities/SessionLogContext';

/**
 * Renders configurable input and display cells for reusable activities.
 *
 * @param {Object} props - Component properties.
 * @param {Array} props.fields - Ordered input, output, or token descriptions.
 * @param {number} props.columns - Number of columns in the grid layout.
 * @param {string} props.className - Additional layout classes.
 * @param {boolean} props.customLayout - Leaves cell positioning to the caller's CSS.
 * @returns {JSX.Element} The input grid.
 */
export default function InputGrid({
  fields = [],
  columns = 2,
  activity = '',
  className = '',
  customLayout = false,
  labelClassName = ''
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const gridClassName = customLayout
    ? className
    : ['activity-input-grid', className].filter(Boolean).join(' ');
  const gridStyle = customLayout
    ? undefined
    : { gridTemplateColumns: `repeat(${Math.max(1, Number(columns) || 1)}, minmax(0, 1fr))` };

  return (
    <div className={gridClassName} style={gridStyle}>
      {fields.map((field, index) => {
        const key = field.id || field.key || `field-${index}`;
        const fieldClassName = ['activity-input-grid__cell', field.className].filter(Boolean).join(' ');

        if (field.kind === 'token') {
          return (
            <span key={key} className={fieldClassName} aria-hidden={field.ariaHidden ?? true}>
              {field.value}
            </span>
          );
        }

        if (field.kind === 'output' || field.editable === false) {
          return (
            <div key={key} className={fieldClassName}>
              {field.label ? <span className={labelClassName}>{field.label}</span> : null}
              <div className={field.displayClassName || 'activity-input-grid__output'}>
                {field.value ?? field.fallback ?? '-'}
              </div>
            </div>
          );
        }

        return (
          <label key={key} className={fieldClassName}>
            {field.label ? <span className={labelClassName}>{field.label}</span> : null}
            <input
              className={field.inputClassName || 'activity-input-grid__input'}
              type={field.type || 'text'}
              value={field.value === null || field.value === undefined ? '' : String(field.value)}
              placeholder={field.placeholder || ''}
              disabled={Boolean(field.disabled) || !canEdit}
              aria-label={field.ariaLabel || field.label || undefined}
              onChange={(event) => {
                const value = event.target.value;
                field.onChange?.(value, event);
                sessionLogging?.logEvent('activity.input.changed', activity, {
                  field: String(field.id || field.key || field.label || key),
                  value
                });
              }}
            />
          </label>
        );
      })}
    </div>
  );
}

