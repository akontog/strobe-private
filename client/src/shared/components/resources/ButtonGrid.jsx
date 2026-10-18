import React from 'react';
import './ButtonGrid.css';

/**
 * Places configurable interactive or display items in a responsive grid.
 */
export default function ButtonGrid({
  items = [],
  columns = 10,
  renderItem,
  getItemKey,
  className = '',
  ariaLabel,
  role = 'grid',
  style = {}
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
