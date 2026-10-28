import React, { useState } from 'react';
import './Accordion.css';

export const Accordion = ({
  title, // Main heading displayed on the accordion button.
  subtitle = '', // Optional secondary heading.
  icon = null, // Optional icon shown before the heading.
  open = false, // Controls the initial open state when true.
  defaultOpen = false, // Opens the accordion initially when true.
  className = '', // Additional CSS classes for the accordion.
  onToggle, // Receives the new open state after a toggle.
  children // Content shown inside the accordion.
}) => {
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
