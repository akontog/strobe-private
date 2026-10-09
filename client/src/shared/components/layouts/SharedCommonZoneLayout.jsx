import React from 'react';
import './shared-common-zone-layout.css';

export default function SharedCommonZoneLayout({
  className = '',
  isGroupingMode = false,
  leftPanel = null,
  centerPanel = null,
  rightPanel = null,
  children = null
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
