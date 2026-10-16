import React, { useState } from 'react';

export const Accordion = ({ title, subtitle = '', icon = null, open = false, defaultOpen = false, className = '', children }) => {
  const [isOpen, setIsOpen] = useState(open || defaultOpen);
  const prefix = icon ? `${icon} ` : '';

  return (
    <div className={['accordion', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="accordion-btn"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{prefix}{title}{subtitle ? <small className="accordion-subtitle">{subtitle}</small> : null}</span>
        <span className="accordion-icon">{isOpen ? '-' : '+'}</span>
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};
