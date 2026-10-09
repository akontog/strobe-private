import React from 'react';

export default function BlueNumberBox({ value, label }) {
  return (
    <div style={{ background: '#1d78d6', color: '#fff', borderRadius: 10, padding: '8px 12px', minWidth: 80, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      {label ? <div style={{ fontSize: 12, opacity: 0.9 }}>{label}</div> : null}
    </div>
  );
}
