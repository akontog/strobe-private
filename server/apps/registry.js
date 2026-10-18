const fs = require('fs');
const path = require('path');

const LABS_ROOT = path.join(__dirname, '..', '..', 'client', 'src', 'labs');
// Root directory for all lab static files
const APP_DEFINITIONS = [
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
  },
  {
    slug: 'identities-lab',
    labId: 'identities-lab',
    title: 'Identities Lab',
    description: 'Algebraic identities with geometric proofs for sum square, difference square, and difference of squares.',
    roles: ['teacher', 'student', 'client'],
    kind: 'static',
    staticDir: path.join(LABS_ROOT, 'identities-lab'),
    teacherEntry: 'teacher.html',
    clientEntry: 'student.html'
  },
  {
    slug: 'equations-lab',
    labId: 'equations-lab',
    title: 'Equations',
    description: 'Collaborative algebra-tile activities for solving simple equations.',
    roles: ['teacher', 'student', 'client'],
    kind: 'react'
  },
  {
    slug: 'activity-runner',
    labId: 'activity-runner',
    title: 'Shared Activities',
    description: 'Teacher selected activities built from shared resources.',
    roles: ['teacher', 'student', 'client'],
    kind: 'react'
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
  const publicSlug = app.slug === 'polynomial-lab'
    ? 'polynomials'
    : app.slug === 'linear-systems-lab'
      ? 'linear-systems'
      : app.slug;
  const routeRole = normalizedRole === 'teacher' || normalizedRole === 'admin' ? 'teacher' : 'student';

  return `/workshops/${publicSlug}/${routeRole}`;
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
