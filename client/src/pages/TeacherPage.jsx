import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TeacherPage() {
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
    'neural-lab': 'magenta',
    'primes-lab': 'amber',
    'linear-systems-lab': 'green',
    'identities-lab': 'indigo'
  };

  const iconBySlug = {
    'geometry-live': '📐',
    'buffon-needle': '📌',
    'neural-lab': '🧠',
    'primes-lab': '🔢',
    'linear-systems-lab': '📉',
    'identities-lab': '🧮'
  };

  const extraTeacherTools = [
    {
      id: 'geogebra-monitor',
      titleKey: 'geoGebraMonitorTitle',
      descriptionKey: 'geoGebraMonitorDescription',
      path: '/tools/geogebra-monitor',
      tone: 'indigo',
      icon: '📊'
    }
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt={t('strobeLogo')} />
            <h1>{t('teacherDashboard')}</h1>
          </div>
          <p className="page-hero__lead">{t('teacherLead')}</p>
          <div className="page-meta-row">
            <span className="page-chip">GET /teacher/apps</span>
            <span className="page-chip">{t('spaNavigation')}</span>
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
                    <div className="muted">{t('teacher')}</div>
                    <h2 className="app-title">{iconBySlug[app.slug] || '🧩'} {t(`apps.${app.slug}.title`, { defaultValue: app.title })}</h2>
                  </div>
                </div>
                <p className="app-desc">{t(`apps.${app.slug}.description`, { defaultValue: app.description })}</p>
                <ul className="role-features">
                  <li>{app.slug}</li>
                  <li>{app.kind}</li>
                </ul>
                <div className="btn-row dashboard-action-row">
                  <Link className="dashboard-action-link" to={`/labs/${app.slug}/teacher`}>{t('openTeacherView')}</Link>
                </div>
              </article>
            ))}

            {extraTeacherTools.map((tool) => (
              <article key={tool.id} className={`strobe-note strobe-note--${tool.tone}`}>
                <div className="app-head">
                  <div>
                    <div className="muted">{t('tool')}</div>
                    <h2 className="app-title">{tool.icon} {t(tool.titleKey)}</h2>
                  </div>
                </div>
                <p className="app-desc">{t(tool.descriptionKey)}</p>
                <ul className="role-features">
                  <li>{t('teacherAccessible')}</li>
                  <li>{tool.path}</li>
                </ul>
                <div className="btn-row dashboard-action-row">
                  <Link className="dashboard-action-link" to={tool.path}>{t('openMonitor')}</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
