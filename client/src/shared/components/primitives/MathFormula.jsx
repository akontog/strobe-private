import React, { useEffect, useRef } from 'react';

export default function MathFormula({
  formula = '' // MathJax-compatible formula rendered by the component.
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    containerRef.current.innerHTML = formula || '';

    const tryTypeset = () => {
      if (!containerRef.current || !window.MathJax) return false;
      const mathJax = window.MathJax;
      if (mathJax.Hub && typeof mathJax.Hub.Queue === 'function') {
        mathJax.Hub.Queue(['Typeset', mathJax.Hub, containerRef.current]);
        return true;
      }
      if (typeof mathJax.typesetPromise !== 'function') return false;
      const doTypeset = () => mathJax.typesetPromise([containerRef.current]).catch((error) => console.warn('MathJax error:', error));
      if (mathJax.startup?.promise) mathJax.startup.promise.then(doTypeset).catch((error) => console.warn('MathJax startup error:', error));
      else doTypeset();
      return true;
    };

    if (tryTypeset()) return undefined;
    const intervalId = window.setInterval(() => {
      if (tryTypeset()) window.clearInterval(intervalId);
    }, 120);
    return () => window.clearInterval(intervalId);
  }, [formula]);

  return <span ref={containerRef} />;
}
