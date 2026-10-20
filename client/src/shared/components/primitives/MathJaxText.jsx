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
  const [isTypeset, setIsTypeset] = useState(false);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return undefined;
    let cancelled = false;
    let timerId = null;
    const source = stripMathDelimiters(text);
    setIsTypeset(false);
    output.textContent = source;

    const typeset = async () => {
      const mathJax = window.MathJax;
      if (!mathJax) {
        timerId = window.setTimeout(typeset, 120);
        return;
      }

      try {
        if (mathJax.startup?.promise) await mathJax.startup.promise;
        if (cancelled) return;
        if (typeof mathJax.tex2chtmlPromise === 'function') {
          const rendered = await mathJax.tex2chtmlPromise(source);
          if (!cancelled) {
            output.replaceChildren(rendered);
            setIsTypeset(true);
          }
          return;
        }
        output.textContent = `\\(${source}\\)`;
        if (mathJax.Hub && typeof mathJax.Hub.Queue === 'function') {
          mathJax.Hub.Queue(['Typeset', mathJax.Hub, output]);
          setIsTypeset(true);
          return;
        }
        if (typeof mathJax.typesetPromise === 'function') {
          await mathJax.typesetPromise([output]);
          if (!cancelled) setIsTypeset(true);
          return;
        }
        timerId = window.setTimeout(typeset, 120);
      } catch {
        if (!cancelled) output.textContent = source;
      }
    };

    typeset();
    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [text]);

  return <>
    <span ref={outputRef} aria-hidden={!isTypeset} style={!isTypeset ? { display: 'none' } : undefined} />
    {!isTypeset ? <span>{stripMathDelimiters(text)}</span> : null}
  </>;
}
