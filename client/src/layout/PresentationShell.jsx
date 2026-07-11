import React from 'react';

export default function PresentationShell({ sidebar, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', background: '#f8fafc' }}>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}
