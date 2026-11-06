import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function parseInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(markdown) {
  const blocks = String(markdown || '').trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map((block, index) => {
    const heading = block.match(/^(#{2,6})\s+(.+)$/);
    if (heading) return <h3 key={index}>{parseInlineMarkdown(heading[2])}</h3>;
    const lines = block.split('\n');
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return <ul key={index}>{lines.map((line, itemIndex) => (
        <li key={itemIndex}>{parseInlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}</li>
      ))}</ul>;
    }
    return <p key={index}>{parseInlineMarkdown(lines.join(' '))}</p>;
  });
}

function parseMarkdownDocument(markdown) {
  const match = String(markdown || '').match(/^#\s+(.+?)\s*\r?\n/);
  return {
    title: match?.[1] || 'Θεωρία',
    content: match ? markdown.slice(match[0].length) : markdown
  };
}

/** Shows the Markdown theory attached to the currently selected activity. */
export default function TheoryButton({ theory }) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [loadedTheory, setLoadedTheory] = useState(null);
  const activeTheory = typeof theory === 'string' ? loadedTheory : theory;
  const content = activeTheory?.content;
  const title = activeTheory?.title || 'Θεωρία';

  useEffect(() => {
    const syncPortalTarget = () => setPortalTarget(document.fullscreenElement || document.body);
    syncPortalTarget();
    document.addEventListener('fullscreenchange', syncPortalTarget);
    return () => document.removeEventListener('fullscreenchange', syncPortalTarget);
  }, []);

  useEffect(() => {
    if (typeof theory !== 'string') {
      setLoadedTheory(null);
      return undefined;
    }
    let cancelled = false;
    setLoadedTheory(null);
    fetch(theory, { cache: 'no-store' })
      .then((response) => response.ok ? response.text() : null)
      .then((payload) => { if (!cancelled) setLoadedTheory(payload ? parseMarkdownDocument(payload) : null); })
      .catch(() => { if (!cancelled) setLoadedTheory(null); });
    return () => { cancelled = true; };
  }, [theory]);

  return <>
    <button type="button" className="common-zone-theory-toggle" aria-label="Εμφάνιση θεωρίας"
      title="Θεωρία" aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
      <span aria-hidden="true">i</span>
    </button>
    {isOpen && portalTarget ? createPortal(<div className="common-zone-theory-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setIsOpen(false);
    }}>
      <section className="common-zone-theory-dialog" role="dialog" aria-modal="true" aria-labelledby="common-zone-theory-title">
        <button type="button" className="common-zone-theory-close" aria-label="Κλείσιμο θεωρίας" onClick={() => setIsOpen(false)}>×</button>
        <h2 id="common-zone-theory-title">{title}</h2>
        <div className="common-zone-theory-content">{content ? renderMarkdown(content) : 'Δεν έχει προστεθεί θεωρία για αυτή τη δραστηριότητα.'}</div>
      </section>
    </div>, portalTarget) : null}
  </>;
}
