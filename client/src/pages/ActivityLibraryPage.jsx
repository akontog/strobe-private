import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeroTitle } from '../shared/components';
import { resolveActivityDocument } from '../shared/components/activities/activityDocument';
import { getWorkshopAppSlug } from '../workshops/activityLibrary';
import { getWorkshopPath } from '../shared/utils/workshopPaths';
import './ActivityLibraryPage.css';

const SUPPORTED_RESOURCES = new Set([
  'input-grid', 'grouping-drag-drop', 'placement-board', 'venn-board', 'algebra-tiles',
  'collaborative-geogebra', 'number-line', 'cartesian-plane', 'collaborative-algebra-tiles',
  'vision-board', 'options-grid'
]);

function getActivityTitle(activity) {
  return activity?.activity?.title || activity?.title || activity?.name || activity?.filename || '';
}

function isUsableActivity(activity) {
  if (getWorkshopAppSlug(activity)) return true;
  const resolved = resolveActivityDocument(activity);
  return Boolean(resolved?.resource && SUPPORTED_RESOURCES.has(resolved.resource));
}

export default function ActivityLibraryPage() {
  const { t } = useTranslation('interface');
  const navigate = useNavigate();
  const [serverActivities, setServerActivities] = React.useState([]);
  const [selectedServerKey, setSelectedServerKey] = React.useState('');
  const [localActivity, setLocalActivity] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [opening, setOpening] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    fetch('/teacher/activities', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(t('activityLibrary.serverLoadError'));
        return response.json();
      })
      .then((activities) => {
        if (!cancelled) {
          setServerActivities(Array.isArray(activities) ? activities : []);
          setError('');
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || t('activityLibrary.serverLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  const selectedServerActivity = serverActivities.find((item) => `${item.resource}/${item.filename}` === selectedServerKey) || null;
  const selectedActivity = localActivity?.document || selectedServerActivity;
  const selectedTitle = localActivity?.name || getActivityTitle(selectedActivity);

  const selectServerActivity = (item) => {
    setSelectedServerKey(`${item.resource}/${item.filename}`);
    setLocalActivity(null);
    setError('');
  };

  const loadLocalFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      const document = JSON.parse(await file.text());
      if (!isUsableActivity(document)) throw new Error(t('activityLibrary.invalidFile'));
      setLocalActivity({
        name: getActivityTitle(document) || file.name,
        document: { ...document, filename: `local-${file.name}` }
      });
      setSelectedServerKey('');
    } catch (loadError) {
      setLocalActivity(null);
      setError(loadError instanceof SyntaxError ? t('activityLibrary.invalidJson') : loadError.message || t('activityLibrary.invalidFile'));
    }
  };

  const applyActivity = async () => {
    if (!selectedActivity || opening) return;
    setOpening(true);
    setError('');
    try {
      let activity = selectedActivity;
      if (selectedServerActivity) {
        const response = await fetch(`/teacher/activities/${encodeURIComponent(selectedServerActivity.resource)}/${encodeURIComponent(selectedServerActivity.filename)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(t('activityLibrary.activityLoadError'));
        activity = await response.json();
      }
      if (!isUsableActivity(activity)) throw new Error(t('activityLibrary.invalidFile'));

      const appSlug = getWorkshopAppSlug(activity);
      const response = await fetch('/teacher/classroom/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSlug ? { app: appSlug } : { app: 'activity-runner', activity })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || t('activityLibrary.applyError'));
      navigate(appSlug
        ? `${getWorkshopPath(appSlug, 'teacher')}?activity=${encodeURIComponent(activity.activity?.id || '')}`
        : '/workshops/activities/teacher');
    } catch (openError) {
      setError(openError.message || t('activityLibrary.applyError'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className="dashboard-page activity-library-page">
      <div className="dashboard-shell">
        <HeroTitle title={t('activityLibrary.title')} />
        <p className="activity-library-lead">{t('activityLibrary.description')}</p>

        <div className="activity-library-layout">
          <section className="activity-library-panel" aria-labelledby="activity-library-workshop-heading">
            <div className="activity-library-panel__heading">
              <h2 id="activity-library-workshop-heading">{t('activityLibrary.savedActivitiesTitle')}</h2>
              <label className="activity-library-upload">
                <input type="file" accept=".json,application/json" onChange={loadLocalFile} />
                <span>{t('activityLibrary.chooseFile')}</span>
              </label>
            </div>
            <p className="activity-library-hint">{t('activityLibrary.workshopActivitiesFolder')}</p>
            {loading ? <p className="activity-library-empty">{t('activityLibrary.loading')}</p> : null}
            {!loading && serverActivities.length === 0 ? <p className="activity-library-empty">{t('activityLibrary.empty')}</p> : null}
            <div className="activity-library-list">
              {serverActivities.map((item) => {
                const key = `${item.resource}/${item.filename}`;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`activity-library-item${selectedServerKey === key ? ' is-selected' : ''}`}
                    onClick={() => selectServerActivity(item)}
                  >
                    <span className="activity-library-item__title">{item.name || item.filename}</span>
                    <span className="activity-library-item__meta">{item.resource} · {item.filename}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="activity-library-panel activity-library-selection" aria-labelledby="activity-library-selection-heading">
            <h2 id="activity-library-selection-heading">{t('activityLibrary.selectionTitle')}</h2>
            {localActivity ? <p className="activity-library-local-file">{t('activityLibrary.localFile')}: {localActivity.name}</p> : null}
            {selectedActivity ? (
              <>
                <h3>{selectedTitle}</h3>
                <p>{selectedActivity.activity?.objective || selectedActivity.subtitle || selectedActivity.objective || t('activityLibrary.noDescription')}</p>
                <button type="button" className="activity-library-apply" onClick={applyActivity} disabled={opening}>
                  {opening ? t('activityLibrary.opening') : t('activityLibrary.apply')}
                </button>
              </>
            ) : <p className="activity-library-empty">{t('activityLibrary.selectHint')}</p>}
            {error ? <p className="activity-library-error" role="alert">{error}</p> : null}
          </section>
        </div>
      </div>
    </section>
  );
}
