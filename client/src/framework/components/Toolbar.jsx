import React from 'react';

export default function Toolbar({ title, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}
