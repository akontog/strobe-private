import React, { useEffect, useRef, useState } from 'react';

function stripMathDelimiters(value) {
  const text = String(value || '').trim();
  if (text.length > 3 && text.startsWith('$$') && text.endsWith('$$')) return text.slice(2, -2).trim();
  if ((text.startsWith('\\(') && text.endsWith('\\)')) || (text.startsWith('\\[') && text.endsWith('\\]'))) {
    return text.slice(2, -2).trim();
  }
  if (text.length > 1 && text.startsWith('$') && text.endsWith('$')) return text.slice(1, -1).trim();
  return text.replace(/\$\$([\s\S]+?)\$\$|\$([\s\S]+?)\$/g, (match, displayMath, inlineMath) => displayMath || inlineMath);
}

/** Renders a TeX expression with MathJax and falls back to plain text on parse errors. */
export default function MathJaxText({ text = '' }) {
  const outputRef = useRef(null);
  const [typesetText, setTypesetText] = useState(null);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return undefined;
    let cancelled = false;
    let timerId = null;
    const source = stripMathDelimiters(text);
    setTypesetText(null);
    output.textContent = `\\(${source}\\)`;

    const typeset = async () => {
      const mathJax = window.MathJax;
      if (!mathJax || typeof mathJax.typesetPromise !== 'function') {
        timerId = window.setTimeout(typeset, 120);
        return;
      }

      try {
        if (mathJax.startup?.promise) await mathJax.startup.promise;
        if (cancelled) return;
        mathJax.typesetClear?.([output]);
        await mathJax.typesetPromise([output]);
        if (!cancelled) setTypesetText(text);
      } catch {
        if (!cancelled) {
          output.textContent = source;
          setTypesetText(null);
        }
      }
    };

    typeset();
    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [text]);

  return <>
    <span ref={outputRef} aria-hidden={typesetText !== text} style={typesetText !== text ? { display: 'none' } : undefined} />
    {typesetText !== text ? <span>{stripMathDelimiters(text)}</span> : null}
  </>;
}
