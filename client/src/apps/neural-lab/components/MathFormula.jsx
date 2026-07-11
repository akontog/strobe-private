import React, { useRef, useEffect } from 'react';

const MathFormula = ({ formula }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Keep raw TeX delimiters in the DOM so MathJax can typeset this node.
    containerRef.current.innerHTML = formula || '';

    const tryTypeset = () => {
      if (!containerRef.current || !window.MathJax) return false;

      const mj = window.MathJax;

      if (mj.Hub && typeof mj.Hub.Queue === 'function') {
        mj.Hub.Queue(['Typeset', mj.Hub, containerRef.current]);
        return true;
      }

      if (typeof mj.typesetPromise !== 'function') {
        return false;
      }

      const doTypeset = () => {
        mj.typesetPromise([containerRef.current]).catch((err) => {
          console.warn('MathJax error:', err);
        });
      };

      if (mj.startup && mj.startup.promise) {
        mj.startup.promise.then(doTypeset).catch((err) => {
          console.warn('MathJax startup error:', err);
        });
      } else {
        doTypeset();
      }

      return true;
    };

    if (tryTypeset()) return;

    // MathJax can load asynchronously after React mount; retry briefly.
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
};

export default MathFormula;