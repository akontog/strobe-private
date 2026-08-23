import React, { useState } from 'react';

export const Accordion = ({ title, icon = null, open = false, children }) => {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="accordion">
      <button
        className="accordion-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{icon + title}</span>
        <span className="accordion-icon">{isOpen ? '▲' : '▼'}</span>
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};
