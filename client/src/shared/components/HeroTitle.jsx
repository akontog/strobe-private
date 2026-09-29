import React from 'react';

export default function HeroTitle({ children, className = '' }) {
  return (
    <div className={`hero-title ${className}`.trim()}>
      <div className="main-equation">{children}</div>
    </div>
  );
}
