import React from 'react';

export const ToolButton = ({ id, label, active, onClick, tooltip }) => (
  <button
    className={`tool-icon ${active ? 'active' : ''}`}
    id={id}
    onClick={onClick}
    data-tooltip={tooltip}
  >
    {label}
  </button>
);

export const Toolbar = ({ buttons }) => (
  <div className="toolbar">
    {buttons}
  </div>
);
