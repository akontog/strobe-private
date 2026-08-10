import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function TeacherPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      try {
        const response = await fetch('/teacher/apps');
        if (!response.ok) {
          throw new Error(`Teacher apps request failed with ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setApps(Array.isArray(payload) ? payload : []);
          setError('');
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load teacher apps.');
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
    'buffon-needle': 'red',
    'fourier-lab': 'blue',
    'neural-lab': 'magenta',
    'primes-lab': 'amber'
  };

  const iconBySlug = {
    'geometry-live': '📐',
    'buffon-needle': '📌',
    'fourier-lab': '🌊',
    'neural-lab': '🧠',
    'primes-lab': '🔢'
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt="Strobe Logo" />
            <h1>Teacher Dashboard</h1>
          </div>
          <p className="page-hero__lead">Εκκίνηση εφαρμογών σε teacher mode και διαχείριση classroom activities μέσω REST API.</p>
          <div className="page-meta-row">
            <span className="page-chip">GET /teacher/apps</span>
            <span className="page-chip">React SPA</span>
          </div>
        </header>

        {loading ? <p className="page-feedback">Loading apps...</p> : null}
        {error ? <p className="page-feedback page-feedback--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="postit-grid app-grid">
            {apps.map((app) => (
              <article key={app.slug} className={`strobe-note strobe-note--${toneBySlug[app.slug] || 'indigo'}`}>
                <div className="app-head">
                  <div>
                    <div className="muted">teacher</div>
                    <h2 className="app-title">{iconBySlug[app.slug] || '🧩'} {app.title}</h2>
                  </div>
                </div>
                <p className="app-desc">{app.description}</p>
                <ul className="role-features">
                  <li>{app.slug}</li>
                  <li>{app.kind}</li>
                </ul>
                <div className="btn-row dashboard-action-row">
                  <Link className="dashboard-action-link" to={`/labs/${app.slug}/teacher`}>Open teacher view</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}