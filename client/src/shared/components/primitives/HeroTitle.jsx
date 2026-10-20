import React from 'react';

export default function HeroTitle({
  children, // Heading content when title is not set.
  title = '', // Main heading text.
  subtitle = '', // Optional supporting text.
  className = '' // Additional CSS classes for the title block.
}) {
  const resolvedTitle = title || children;

  return (
    <div className={`hero ${className}`.trim()}>
      <div className="hero-title">{resolvedTitle}</div>
      {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
    </div>
  );
}
