import React from 'react';
import './OptionsGrid.css';

/** Converts number and letter ranges, comma lists, or combined ranges into grid items. */
export function parseOptionsExpression(expression) {
  const values = [];
  const segments = String(expression || '').split(',').map((part) => part.trim()).filter(Boolean);
  segments.forEach((segment) => {
    const parts = segment.split(':').map((part) => part.trim());
    if (parts.length === 1) {
      values.push(parts[0]);
      return;
    }
    if (parts.length > 3) return;
    const isNumber = parts.every((part) => /^-?\d+(?:\.\d+)?$/.test(part));
    const isLetter = parts.length === 2 && parts.every((part) => /^[a-z]$/i.test(part));
    if (!isNumber && !isLetter) return;
    const start = isLetter ? parts[0].toLowerCase().charCodeAt(0) : Number(parts[0]);
    const end = isLetter ? parts[1].toLowerCase().charCodeAt(0) : Number(parts[1]);
    const step = parts.length === 3 ? Number(parts[2]) : (start <= end ? 1 : -1);
    if (!Number.isFinite(step) || step === 0 || Math.sign(step) !== Math.sign(end - start || step)) return;
    for (let value = start, count = 0; (step > 0 ? value <= end : value >= end) && count < 500; value += step, count += 1) {
      values.push(isLetter ? String.fromCharCode(value) : String(Number(value.toFixed(6))));
    }
  });
  return values.map((value, index) => ({ id: `option-${index + 1}`, label: value, value }));
}

/**
 * Places configurable interactive or display items in a responsive grid.
 */
export default function OptionsGrid({
  items = [], // Items displayed as buttons in the grid.
  columns = 10, // Number of columns in the grid.
  rows, // Optional number of rows in the grid.
  renderItem, // Renders each item.
  getItemKey, // Returns a stable key for an item.
  className = '', // Additional CSS classes for the grid.
  ariaLabel, // Accessible name for the grid.
  role = 'grid', // ARIA role applied to the grid container.
  style = {} // Inline styles applied to the grid container.
}) {
  const safeColumns = Math.max(1, Number(columns) || 1);

  return (
    <div
      className={['shared-button-grid', className].filter(Boolean).join(' ')}
      style={{ ...style, '--button-grid-columns': safeColumns, ...(rows ? { '--button-grid-rows': Math.max(1, Number(rows) || 1) } : {}) }}
      role={role}
      aria-label={ariaLabel}
    >
      {items.map((item, index) => (
        <React.Fragment key={getItemKey ? getItemKey(item, index) : item?.id ?? item?.key ?? index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}
