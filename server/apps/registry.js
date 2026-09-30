const fs = require('fs');
const path = require('path');

const LABS_ROOT = path.join(__dirname, '..', '..', 'client', 'src', 'labs');

const APP_DEFINITIONS = [
  {
    slug: 'geometry-live',
    labId: 'geometry-lab',
    title: 'Geometry Lab',
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
    labId: 'buffon-lab',
    title: 'Buffon Lab',
    description: 'Multiplayer Buffon experiment with rounds and scoreboards.',
    roles: ['teacher', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'buffon-needle'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'fourier-lab',
    labId: 'fourier-lab',
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
    labId: 'neural-lab',
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
    labId: 'primes-lab',
    title: 'Primes Lab',
    description: 'Sieve of Eratosthenes activity with teacher-controlled steps and a shared number grid.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'primes-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'polynomial-lab',
    labId: 'polynomial-lab',
    title: 'Polynomial Lab',
    description: 'Collaborative polynomial practice with common-zone interactions, student tracking, and teacher-led activities.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'polynomial-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'linear-systems-lab',
    labId: 'linear-systems-lab',
    title: 'Linear Systems Lab',
    description: 'Graphical and algebraic solving of linear systems with shared GeoGebra scenes and teacher/student flow.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'linear-systems-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  }
];

function readLabManifest(app) {
  if (!app || !app.staticDir) {
    return {};
  }

  const manifestPath = path.join(app.staticDir, 'lab.manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return {};
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest && typeof manifest === 'object' ? manifest : {};
  } catch (error) {
    return {};
  }
}

function normalizeApp(app) {
  const manifest = readLabManifest(app) || {};
  const entry = manifest.entry && typeof manifest.entry === 'object' ? manifest.entry : {};

  const nextApp = {
    ...app,
    ...(manifest.labId ? { labId: manifest.labId } : {}),
    ...(manifest.slug ? { slug: manifest.slug } : {}),
    ...(manifest.name ? { title: manifest.name } : {}),
    ...(manifest.roles ? { roles: manifest.roles } : {})
  };

  return {
    ...nextApp,
    teacherEntry: entry.teacher || nextApp.teacherEntry || null,
    clientEntry: entry.student || entry.client || nextApp.clientEntry || nextApp.studentEntry || null,
    studentEntry: entry.student || nextApp.studentEntry || nextApp.clientEntry || null,
    screenEntry: entry.screen || nextApp.screenEntry || null
  };
}

const APPS = APP_DEFINITIONS.map(normalizeApp);

function getAppBySlug(slug) {
  return APPS.find((app) => app.slug === slug) || null;
}

function appMatchesRole(app, role) {
  const normalizedRole = String(role || '').toLowerCase();
  const roles = Array.isArray(app.roles) ? app.roles : [];

  if (normalizedRole === 'admin') {
    return true;
  }

  if (normalizedRole === 'student' || normalizedRole === 'client') {
    return roles.includes(normalizedRole) || roles.includes('student') || roles.includes('client');
  }

  if (normalizedRole === 'screen') {
    return roles.includes('screen') || roles.includes('client');
  }

  return roles.includes(normalizedRole);
}

function listAppsForRole(role) {
  if (role === 'admin') {
    return [...APPS];
  }

  return APPS.filter((app) => appMatchesRole(app, role));
}

function getLaunchPath(app, role) {
  if (!app) {
    return '/';
  }

  const normalizedRole = String(role || '').toLowerCase();
  const mode = normalizedRole === 'teacher' || normalizedRole === 'admin' ? 'teacher' : 'client';

  if (normalizedRole === 'screen' && app.screenEntry) {
    return `/labs/${app.slug}/${app.screenEntry}`;
  }

  const entry = normalizedRole === 'teacher' ? app.teacherEntry : app.clientEntry || app.studentEntry || app.teacherEntry;

  if (!entry) {
    return `/labs/${app.slug}/`;
  }

  const entryPath = `/labs/${app.slug}/${entry}`;

  if (entry.includes('?')) {
    return entryPath;
  }

  if (app.teacherEntry === app.clientEntry) {
    return `${entryPath}?mode=${mode}`;
  }

  return entryPath;
}

function toPublicApp(app, role) {
  return {
    labId: app.labId || app.slug,
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
