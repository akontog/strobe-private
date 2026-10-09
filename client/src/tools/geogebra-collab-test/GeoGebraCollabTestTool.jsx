import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function GeoGebraCollabTestTool() {
  const { t } = useTranslation('interface');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState('');

  const summaryText = useMemo(() => {
    if (!result || !result.summary) {
      return '';
    }

    return t('passedSummary', { passed: result.summary.passed, total: result.summary.total });
  }, [result, t]);

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
          <h1>{t('geoGebraProtocolTest')}</h1>
          <p>{t('geoGebraProtocolDescription')}</p>
        </header>

        <div className="btn-row">
          <button type="button" className="dashboard-action-link" disabled={running} onClick={runTests}>
            {running ? t('running') : t('runProtocolTests')}
          </button>
        </div>

        {errorText ? <p className="page-feedback page-feedback--error">{errorText}</p> : null}
        {summaryText ? <p className="page-feedback">{t('summary')}: {summaryText}</p> : null}

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
