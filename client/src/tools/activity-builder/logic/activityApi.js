export async function fetchApps() {
  const response = await fetch('/teacher/apps');
  if (!response.ok) {
    throw new Error(`Apps request failed with ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function fetchActivities(slug) {
  const response = await fetch(`/teacher/activities/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Activities request failed with ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function fetchActivity(slug, filename) {
  const response = await fetch(`/teacher/activities/${encodeURIComponent(slug)}/${encodeURIComponent(filename)}`);
  if (!response.ok) {
    throw new Error(`Activity request failed with ${response.status}`);
  }
  return response.json();
}

export async function saveActivityRequest(slug, { name, config, notes }) {
  const response = await fetch(`/teacher/activities/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name || 'Activity',
      config,
      notes,
      authorName: 'tools-spa'
    })
  });

  if (!response.ok) {
    throw new Error(`Save failed with ${response.status}`);
  }

  return response.json();
}