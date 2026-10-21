import React from 'react';
import './GroupingItemBank.css';

/** Renders a reusable bank of draggable grouping items. */
export default function GroupingItemBank({
  items = [],
  renderItem,
  label = '',
  className = '',
  itemsClassName = '',
  isHovering = false,
  onClick,
  bankAttributes = {}
}) {
  const bankClassName = ['grouping-dd-bank', isHovering ? 'is-hovering' : '', className].filter(Boolean).join(' ');
  return (
    <section className={bankClassName} data-group-bank="true" onClick={onClick} {...bankAttributes}>
      {label ? <p className="grouping-dd-bank-title">{label}</p> : null}
      <div className={['grouping-dd-bank-items', itemsClassName].filter(Boolean).join(' ')}>
        {items.map((item, index) => renderItem ? renderItem(item, index) : (
          <span key={item.id || index} className="grouping-dd-item">{item.content ?? item.label ?? item.id}</span>
        ))}
      </div>
    </section>
  );
}
