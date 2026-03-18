const path = require('path');

const APPS = [
  {
    slug: 'geometry-live',
    title: 'Collaborative Geometry',
    description: 'Existing shared canvas with real-time points and shapes.',
    roles: ['teacher', 'client'],
    kind: 'legacy',
    teacherEntry: '/client.html',
    clientEntry: '/user.html'
  },
  {
    slug: 'buffon-needle',
    title: "Buffon\'s Needle",
    description: 'Multiplayer Buffon experiment with rounds and scoreboards.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(__dirname, 'buffon-needle'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'fourier-lab',
    title: 'Fourier Lab',
    description: 'Interactive Fourier series demo ready for custom JS features.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(__dirname, 'fourier-lab'),
    teacherEntry: 'index.html',
    clientEntry: 'index.html'
  }
];

function getAppBySlug(slug) {
  return APPS.find((app) => app.slug === slug) || null;
}

function listAppsForRole(role) {
  if (role === 'admin') {
    return [...APPS];
  }

  return APPS.filter((app) => app.roles.includes(role));
}

function getLaunchPath(app, role) {
  if (!app) {
    return '/';
  }

  if (app.kind === 'legacy') {
    return role === 'teacher' || role === 'admin' ? app.teacherEntry : app.clientEntry;
  }

  const mode = role === 'teacher' || role === 'admin' ? 'teacher' : 'client';
  const entry = mode === 'teacher' ? app.teacherEntry : app.clientEntry;

  if (app.teacherEntry === app.clientEntry) {
    return `/apps/${app.slug}/${entry}?mode=${mode}`;
  }

  return `/apps/${app.slug}/${entry}`;
}

function toPublicApp(app, role) {
  return {
    slug: app.slug,
    title: app.title,
    description: app.description,
    roles: app.roles,
    kind: app.kind,
    launchPath: getLaunchPath(app, role)
  };
}

module.exports = {
  getAppBySlug,
  listAppsForRole,
  getLaunchPath,
  toPublicApp
};
