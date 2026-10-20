import React from 'react';
import './GridButton.css';

export default function GridButton({
  children, // Button content.
  className = '', // Additional CSS classes.
  style, // Inline styles for the button.
  title, // Browser tooltip text.
  disabled = false, // Disables button interaction.
  pressed, // Sets the aria-pressed state.
  onClick, // Handles button clicks.
  ...props // Additional native button properties.
}) {
  return (
    <button
      type="button"
      className={['shared-grid-button', className].filter(Boolean).join(' ')}
      style={style}
      title={title}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
