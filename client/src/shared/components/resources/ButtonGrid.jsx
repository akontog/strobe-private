import React from 'react';
import './ButtonGrid.css';

/**
 * Places configurable interactive or display items in a responsive grid.
 */
export default function ButtonGrid({
  items = [], // Items displayed as buttons in the grid.
  columns = 10, // Number of columns in the grid.
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
      style={{ ...style, '--button-grid-columns': safeColumns }}
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
