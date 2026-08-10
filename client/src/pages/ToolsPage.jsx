import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTools() {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error(`Tools request failed with ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setTools(Array.isArray(payload) ? payload : []);
          setError('');
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load tools.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTools();

    return () => {
      cancelled = true;
    };
  }, []);

  const toolMeta = useMemo(() => ({
    'activity-builder': {
      icon: '🗂️',
      tone: 'magenta',
      helper: 'Teacher lesson designer and activity JSON editor.'
    },
    'camera-speed-test': {
      icon: '🎥',
      tone: 'blue',
      helper: 'Roundtrip frame benchmark for the detection pipeline.'
    },
    'linear-seperation': {
      icon: '🧠',
      tone: 'orange',
      helper: 'Interactive dataset-based linear separation tool.'
    }
  }), []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt="Strobe Logo" />
            <h1>Tools</h1>
          </div>
          <p className="page-hero__lead">Εργαλεία για μάθημα και δοκιμές, με δεδομένα από το API endpoint /api/tools.</p>
          <div className="page-meta-row">
            <span className="page-chip">GET /api/tools</span>
            <span className="page-chip">React page</span>
          </div>
        </header>

        {loading ? <p className="page-feedback">Loading tools...</p> : null}
        {error ? <p className="page-feedback page-feedback--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="postit-grid app-grid">
            {tools.map((tool) => {
              const meta = toolMeta[tool.id] || { icon: '🧰', tone: 'green', helper: '' };

              return (
                <article key={tool.id} className={`strobe-note strobe-note--${meta.tone}`}>
                  <div className="app-head">
                    <div>
                      <div className="muted">tool</div>
                      <h2 className="app-title">{meta.icon} {tool.title}</h2>
                    </div>
                    <span className={`availability-pill ${tool.available ? 'is-available' : 'is-unavailable'}`}>
                      {tool.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="app-desc">{tool.description}</p>
                  {meta.helper ? <p className="tool-helper-text">{meta.helper}</p> : null}
                  <ul className="role-features">
                    <li>{tool.path}</li>
                    <li>{tool.available ? 'Ready to open' : 'Build or enable required feature first'}</li>
                  </ul>
                  <div className="btn-row dashboard-action-row">
                    <Link className="dashboard-action-link" to={tool.path}>Open tool</Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}