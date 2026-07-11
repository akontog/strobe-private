import React from 'react';

export default function PresentationSidebar({ title, children }) {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}
