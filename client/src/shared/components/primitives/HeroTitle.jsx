import React from 'react';

export default function HeroTitle({
  children,
  title = '',
  subtitle = '',
  className = ''
}) {
  const resolvedTitle = title || children;

  return (
    <div className={`hero ${className}`.trim()}>
      <div className="hero-title">{resolvedTitle}</div>
      {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
    </div>
  );
}
