import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function StudentPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      try {
        const response = await fetch('/client/apps');
        if (!response.ok) {
          throw new Error(`Student apps request failed with ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setApps(Array.isArray(payload) ? payload : []);
          setError('');
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load student apps.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApps();

    return () => {
      cancelled = true;
    };
  }, []);

  const toneBySlug = {
    'geometry-live': 'indigo',
    'buffon-needle': 'orange',
    'fourier-lab': 'blue',
    'neural-lab': 'magenta',
    'primes-lab': 'green'
  };

  const iconBySlug = {
    'geometry-live': '🖱️',
    'buffon-needle': '🎯',
    'fourier-lab': '🎵',
    'neural-lab': '⚡',
    'primes-lab': '🧮'
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt="Strobe Logo" />
            <h1>Student Launcher</h1>
          </div>
          <p className="page-hero__lead">Επιλογή app και μετάβαση σε student routes που ανήκουν πλέον στο React Router.</p>
          <div className="page-meta-row">
            <span className="page-chip">GET /client/apps</span>
            <span className="page-chip">SPA navigation</span>
          </div>
        </header>

        {loading ? <p className="page-feedback">Loading apps...</p> : null}
        {error ? <p className="page-feedback page-feedback--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="postit-grid app-grid">
            {apps.map((app) => (
              <article key={app.slug} className={`strobe-note strobe-note--${toneBySlug[app.slug] || 'orange'}`}>
                <div className="app-head">
                  <div>
                    <div className="muted">student</div>
                    <h2 className="app-title">{iconBySlug[app.slug] || '🧩'} {app.title}</h2>
                  </div>
                </div>
                <p className="app-desc">{app.description}</p>
                <ul className="role-features">
                  <li>{app.slug}</li>
                  <li>{app.kind}</li>
                </ul>
                <div className="btn-row dashboard-action-row">
                  <Link className="dashboard-action-link" to={`/labs/${app.slug}/student`}>Open student view</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}