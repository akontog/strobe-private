import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ToolsPage() {
  const { t } = useTranslation('interface');
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
      helper: 'toolHelpers.activityBuilder'
    },
    'camera-speed-test': {
      icon: '🎥',
      tone: 'blue',
      helper: 'toolHelpers.cameraSpeedTest'
    },
    'geogebra-collab': {
      icon: '📐',
      tone: 'green',
      helper: 'toolHelpers.geoGebraCollaborative'
    },
    'geogebra-collab-test': {
      icon: '🧪',
      tone: 'orange',
      helper: 'toolHelpers.geoGebraProtocolTest'
    },
    'geogebra-monitor': {
      icon: '📊',
      tone: 'indigo',
      helper: 'toolHelpers.geoGebraMonitor'
    },
    console: {
      icon: '⌁',
      tone: 'indigo',
      helper: 'toolHelpers.console'
    },
    'linear-seperation': {
      icon: '🧠',
      tone: 'orange',
      helper: 'toolHelpers.linearSeparation'
    }
  }), []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt={t('strobeLogo')} />
            <h1>{t('tools')}</h1>
          </div>
          <p className="page-hero__lead">{t('toolsLead')}</p>
          <div className="page-meta-row">
            <span className="page-chip">GET /api/tools</span>
            <span className="page-chip">{t('reactPage')}</span>
          </div>
        </header>

        {loading ? <p className="page-feedback">{t('loadingTools')}</p> : null}
        {error ? <p className="page-feedback page-feedback--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="postit-grid app-grid">
            {tools.map((tool) => {
              const meta = toolMeta[tool.id] || { icon: '🧰', tone: 'green', helper: '' };

              return (
                <article key={tool.id} className={`strobe-note strobe-note--${meta.tone}`}>
                  <div className="app-head">
                    <div>
                      <div className="muted">{t('tool')}</div>
                      <h2 className="app-title">{meta.icon} {t(`tools.${tool.id}.title`, { defaultValue: tool.title })}</h2>
                    </div>
                    <span className={`availability-pill ${tool.available ? 'is-available' : 'is-unavailable'}`}>
                      {tool.available ? t('available') : t('unavailable')}
                    </span>
                  </div>
                  <p className="app-desc">{t(`tools.${tool.id}.description`, { defaultValue: tool.description })}</p>
                  {meta.helper ? <p className="tool-helper-text">{t(meta.helper)}</p> : null}
                  <ul className="role-features">
                    <li>{tool.path}</li>
                    <li>{tool.available ? t('readyToOpen') : t('enableFeature')}</li>
                  </ul>
                  <div className="btn-row dashboard-action-row">
                    <Link className="dashboard-action-link" to={tool.path}>{t('openTool')}</Link>
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
