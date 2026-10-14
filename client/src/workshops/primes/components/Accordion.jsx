import React from 'react';

const Accordion = ({ title, subtitle, defaultOpen = false, children }) => {
  return (
    <details className="prime-accordion" open={defaultOpen}>
      <summary>
        <span className="prime-accordion__title">{title}</span>
        {subtitle ? <span className="prime-accordion__subtitle">{subtitle}</span> : null}
      </summary>
      <div className="prime-accordion__body">{children}</div>
    </details>
  );
};

export default Accordion;
