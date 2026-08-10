import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function LabPage({ role }) {
  const { slug } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadApp() {
      const endpoint = role === 'teacher' ? '/teacher/apps' : '/client/apps';

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`App lookup failed with ${response.status}`);
        }

        const payload = await response.json();
        const apps = Array.isArray(payload) ? payload : [];
        const matchedApp = apps.find((item) => item.slug === slug) || null;

        if (!cancelled) {
          if (!matchedApp) {
            setError('Lab not found.');
            setApp(null);
          } else {
            setApp(matchedApp);
            setError('');
          }
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load lab.');
          setApp(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApp();

    return () => {
      cancelled = true;
    };
  }, [role, slug]);

  if (loading) {
    return <p>Loading lab...</p>;
  }

  if (error || !app) {
    return <p>{error || 'Lab not found.'}</p>;
  }

  const src = role === 'teacher' ? app.teacherLaunchPath : app.clientLaunchPath;

  return (
    <iframe
      title={`${app.title} ${role}`}
      src={src}
      className="embedded-lab-frame"
    />
  );
}