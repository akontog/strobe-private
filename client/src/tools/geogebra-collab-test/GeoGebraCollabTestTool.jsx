import React, { useMemo, useState } from 'react';

export default function GeoGebraCollabTestTool() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState('');

  const summaryText = useMemo(() => {
    if (!result || !result.summary) {
      return '';
    }

    return `${result.summary.passed}/${result.summary.total} passed`;
  }, [result]);

  async function runTests() {
    setRunning(true);
    setErrorText('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/geogebra-collab-test/run', {
        method: 'POST'
      });

      const payload = await response.json();
      setResult(payload);
      if (!response.ok) {
        setErrorText('One or more protocol tests failed.');
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Failed to run tests.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell" style={{ display: 'grid', gap: '1rem' }}>
        <header>
          <h1>GeoGebra Protocol Test Runner</h1>
          <p>Runs realtime integration checks with fake websocket clients over event/data protocol.</p>
        </header>

        <div className="btn-row">
          <button type="button" className="dashboard-action-link" disabled={running} onClick={runTests}>
            {running ? 'Running...' : 'Run protocol tests'}
          </button>
        </div>

        {errorText ? <p className="page-feedback page-feedback--error">{errorText}</p> : null}
        {summaryText ? <p className="page-feedback">Summary: {summaryText}</p> : null}

        {result && Array.isArray(result.tests) ? (
          <div className="postit-grid app-grid">
            {result.tests.map((entry) => (
              <article key={entry.name} className={`strobe-note ${entry.status === 'passed' ? 'strobe-note--green' : 'strobe-note--orange'}`}>
                <h2 className="app-title">{entry.name}</h2>
                <p className="app-desc">{entry.status.toUpperCase()}</p>
                {entry.error ? <p className="tool-helper-text">{entry.error}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
