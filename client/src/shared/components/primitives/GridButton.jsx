import React from 'react';
import './GridButton.css';

export default function GridButton({
  children,
  className = '',
  style,
  title,
  disabled = false,
  pressed,
  onClick,
  ...props
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
