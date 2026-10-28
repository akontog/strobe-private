import React from 'react';
import './SharedCommonZoneLayout.css';

export default function SharedCommonZoneLayout({
  className = '', // Additional classes for the shared workspace.
  isGroupingMode = false, // Uses the compact grouping layout.
  leftPanel = null, // Content for the left region.
  centerPanel = null, // Content for the center region.
  rightPanel = null, // Content for the right region.
  children = null // Replaces the named panel regions when provided.
}) {
  const layoutClassName = [
    'lab-workspace',
    'poly-neural-zone',
    'shared-common-zone-layout',
    isGroupingMode ? 'shared-common-zone-layout--grouping' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClassName}>
      {children ? children : (
        <>
          {!isGroupingMode ? leftPanel : null}
          {centerPanel}
          {!isGroupingMode ? rightPanel : null}
        </>
      )}
    </div>
  );
}
