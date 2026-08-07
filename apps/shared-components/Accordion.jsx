import React, { useState } from 'react';

export const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion">
      <button
        className="accordion-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className="accordion-icon">{isOpen ? '▲' : '▼'}</span>
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};
