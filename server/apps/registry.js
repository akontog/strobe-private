const path = require('path');

const LABS_ROOT = path.join(__dirname, '..', '..', 'client', 'public', 'labs');

const APPS = [
  {
    slug: 'geometry-live',
    title: 'Collaborative Geometry',
    description: 'Existing shared canvas with real-time points and shapes.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'geometry-live'),
    teacherEntry: 'teacher.html',
    clientEntry: 'mouse.html',
    screenEntry: 'camera.html'
  },
  {
    slug: 'buffon-needle',
    title: "Buffon's Needle",
    description: 'Multiplayer Buffon experiment with rounds and scoreboards.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'buffon-needle'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'fourier-lab',
    title: 'Fourier Lab',
    description: 'Interactive Fourier series demo ready for custom JS features.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'fourier-lab'),
    teacherEntry: 'index.html',
    clientEntry: 'index.html'
  },
  {
    slug: 'neural-lab',
    title: 'Neural Lab',
    description: 'Collaborative neural-network weights activity with teacher/student live sync.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'neural-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'primes-lab',
    title: 'Primes Lab',
    description: 'Sieve of Eratosthenes activity with teacher-controlled steps and a shared number grid.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'primes-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
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

  const mode = role === 'teacher' || role === 'admin' ? 'teacher' : 'client';
  if (role === 'screen' && app.screenEntry) {
    return `/labs/${app.slug}/${app.screenEntry}`;
  }

  const entry = mode === 'teacher' ? app.teacherEntry : app.clientEntry;

  if (app.teacherEntry === app.clientEntry) {
    return `/labs/${app.slug}/${entry}?mode=${mode}`;
  }

  return `/labs/${app.slug}/${entry}`;
}

function toPublicApp(app, role) {
  return {
    slug: app.slug,
    title: app.title,
    description: app.description,
    roles: app.roles,
    kind: app.kind,
    launchPath: getLaunchPath(app, role),
    teacherLaunchPath: getLaunchPath(app, 'teacher'),
    clientLaunchPath: getLaunchPath(app, 'client'),
    screenLaunchPath: app.screenEntry ? getLaunchPath(app, 'screen') : null
  };
}

module.exports = {
  getAppBySlug,
  listAppsForRole,
  getLaunchPath,
  toPublicApp
};
