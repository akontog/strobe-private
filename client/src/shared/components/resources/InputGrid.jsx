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
  fields = [], // Input, output, and token descriptions to render.
  columns = 2, // Number of columns in the default grid layout.
  rows, // Optional fixed row count for the default grid layout.
  activity = '', // Activity identifier used in input logs.
  className = '', // Additional CSS classes for the grid.
  customLayout = false, // Leaves cell placement to the caller's CSS.
  labelClassName = 'activity-input-grid__label' // CSS class applied to field labels.
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const gridClassName = customLayout
    ? className
    : ['activity-input-grid', className].filter(Boolean).join(' ');
  const gridStyle = customLayout
    ? undefined
    : {
      gridTemplateColumns: `repeat(${Math.max(1, Number(columns) || 1)}, minmax(0, 1fr))`,
      ...(rows ? { gridTemplateRows: `repeat(${Math.max(1, Number(rows) || 1)}, auto)` } : {})
    };

  return (
    <div className={gridClassName} style={gridStyle}>
      {fields.map((field, index) => {
        const key = field.id || field.key || `field-${index}`;
        const fieldClassName = ['activity-input-grid__cell', field.className].filter(Boolean).join(' ');
        const cellStyle = field.row && field.column
          ? { gridRow: Number(field.row), gridColumn: Number(field.column) }
          : undefined;

        if (field.kind === 'token') {
          return (
            <span key={key} className={fieldClassName} style={cellStyle} aria-hidden={field.ariaHidden ?? true}>
              {field.value}
            </span>
          );
        }

        if (field.kind === 'output' || field.editable === false) {
          return (
            <div key={key} className={fieldClassName} style={cellStyle}>
              {field.label ? <span className={labelClassName}>{field.label}</span> : null}
              <div className={field.displayClassName || 'activity-input-grid__output'}>
                {field.value ?? field.fallback ?? '-'}
              </div>
            </div>
          );
        }

        return (
          <label key={key} className={fieldClassName} style={cellStyle}>
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

