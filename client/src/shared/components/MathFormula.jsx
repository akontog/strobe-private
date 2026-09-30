import React, { useEffect, useRef } from 'react';

export default function MathFormula({ formula = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = formula || '';

    const tryTypeset = () => {
      if (!containerRef.current || !window.MathJax) {
        return false;
      }

      const mathJax = window.MathJax;

      if (mathJax.Hub && typeof mathJax.Hub.Queue === 'function') {
        mathJax.Hub.Queue(['Typeset', mathJax.Hub, containerRef.current]);
        return true;
      }

      if (typeof mathJax.typesetPromise !== 'function') {
        return false;
      }

      const doTypeset = () => {
        mathJax.typesetPromise([containerRef.current]).catch((err) => {
          console.warn('MathJax error:', err);
        });
      };

      if (mathJax.startup && mathJax.startup.promise) {
        mathJax.startup.promise.then(doTypeset).catch((err) => {
          console.warn('MathJax startup error:', err);
        });
      } else {
        doTypeset();
      }

      return true;
    };

    if (tryTypeset()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (tryTypeset()) {
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [formula]);

  return <span ref={containerRef} />;
}
