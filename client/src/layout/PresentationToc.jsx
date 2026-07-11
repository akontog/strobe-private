import React from 'react';

export default function PresentationToc({ items = [], onSelect }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
      {items.map((item) => (
        <li key={item.id || item.label}>
          <button type="button" onClick={() => onSelect && onSelect(item)} style={{ width: '100%' }}>
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
