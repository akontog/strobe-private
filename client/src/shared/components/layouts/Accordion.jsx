import React, { useState } from 'react';

export const Accordion = ({ title, subtitle = '', icon = null, open = false, defaultOpen = false, className = '', onToggle, children }) => {
  const [isOpen, setIsOpen] = useState(open || defaultOpen);
  const prefix = icon ? `${icon} ` : '';

  return (
    <div className={['accordion', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accordion-btn"
        aria-expanded={isOpen}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          onToggle?.(nextOpen);
        }}
      >
        <span>{prefix}{title}{subtitle ? <small className="accordion-subtitle">{subtitle}</small> : null}</span>
        <span className="accordion-icon">{isOpen ? '-' : '+'}</span>
      </button>
      <div className={['accordion-content', isOpen ? 'open' : ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
};
