import React, { useState } from 'react';

export const Accordion = ({ title, icon = null, open = false, children }) => {
  const [isOpen, setIsOpen] = useState(open);
  const prefix = icon ? `${icon} ` : '';

  return (
    <div className="accordion">
      <button
        type="button"
        className="accordion-btn"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{prefix}{title}</span>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};
