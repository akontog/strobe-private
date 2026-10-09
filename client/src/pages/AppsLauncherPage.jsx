import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

export default function AppsLauncherPage() {
  const { t } = useTranslation('interface');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      try {
        const response = await fetch('/teacher/apps');
        if (!response.ok) {
          throw new Error(`Apps launcher request failed with ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setApps(Array.isArray(payload) ? payload : []);
          setError('');
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load apps.');
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

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt={t('strobeLogo')} />
            <h1>{t('appsLauncher')}</h1>
          </div>
          
        </header>

        {loading ? <p className="page-feedback">{t('loadingApps')}</p> : null}
        {error ? <p className="page-feedback page-feedback--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="postit-grid app-grid">
            {apps.map((app) => (
              <article key={app.slug} className={`strobe-note strobe-note--${toneBySlug[app.slug] || 'indigo'}`}>
                <div className="app-head">
                  <div>
                    <div className="muted">{t('launcher')}</div>
                    <h2 className="app-title">{iconBySlug[app.slug] || '🧩'} {app.title}</h2>
                  </div>
                </div>
                <p className="app-desc">{app.description}</p>
                <div className="btn-row dashboard-action-row">
                  <Link className="dashboard-action-link" to={`/labs/${app.slug}/teacher`}>{t('teacher')}</Link>
                  <Link className="dashboard-action-link" to={`/labs/${app.slug}/student`}>{t('student')}</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
