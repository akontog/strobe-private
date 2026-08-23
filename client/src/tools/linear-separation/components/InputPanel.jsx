import React from 'react';

export default function InputPanel(
    { jsonText, onJsonTextChange, onFileUpload, onApply, parseError }
    ) {
  return (
    <article className="tool-card">
      <h2>Εισαγωγή Dataset JSON</h2>
      <textarea
        value={jsonText}
        onChange={(event) => onJsonTextChange(event.target.value)}
        placeholder="Κάνε επικόλληση το JSON εδώ"
        rows={14}
      />
      <div className="tool-actions">
        <input type="file" accept="application/json,.json" onChange={onFileUpload} />
        <button type="button" onClick={onApply}>Φόρτωση JSON</button>
      </div>
      {parseError ? <p className="tool-error">Σφάλμα JSON: {parseError}</p> : null}
    </article>
  );
}