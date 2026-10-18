const express = require('express');
const fs = require('fs');
const path = require('path');
const sessionManager = require('../services/sessionManager');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
  try {
    const payload = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    return Array.isArray(payload.users) ? payload.users : [];
  } catch {
    return [];
  }
}

function normalizeRoles(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  return [...new Set(roles.filter((role) => ['teacher', 'admin'].includes(role)))];
}

function getActiveRole(roles) {
  return roles.includes('admin') ? 'admin' : roles.includes('teacher') ? 'teacher' : 'student';
}

function createAuthRouter() {
  const router = express.Router();

  router.get('/session', (req, res) => {
    const user = readUsers().find((entry) => entry.username === req.session.teacherAccount);
    const roles = user ? normalizeRoles(user) : [];
    const authenticated = roles.includes(req.session.role);
    res.json({
      authenticated,
      role: authenticated ? req.session.role : 'student',
      roles: authenticated ? roles : [],
      username: authenticated ? req.session.teacherAccount : ''
    });
  });

  router.post('/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const requestedRole = String(req.body?.role || '').trim();
    const user = readUsers().find((entry) => entry.username === username && entry.password === password);
    const roles = normalizeRoles(user);

    if (!user || !roles.length) return res.status(401).json({ error: 'Invalid username or password.' });

    if (requestedRole && requestedRole !== 'staff' && !roles.includes(requestedRole)) {
      return res.status(403).json({ error: 'This account does not have that role.' });
    }
    const role = requestedRole === 'staff' ? getActiveRole(roles) : requestedRole || getActiveRole(roles);
    sessionManager.update(req.sessionId, {
      username: user.username,
      role,
      teacherAccount: user.username,
      source: 'teacher-login'
    });
    return res.json({ authenticated: true, role, roles, username: user.username });
  });

  router.post('/role', (req, res) => {
    const role = String(req.body?.role || '').trim();
    if (role === 'student') {
      sessionManager.update(req.sessionId, { role: 'student', teacherAccount: '', source: 'http' });
      return res.json({ authenticated: false, role: 'student', roles: [] });
    }

    const user = readUsers().find((entry) => entry.username === req.session.teacherAccount);
    const roles = normalizeRoles(user);
    if (!user || !roles.includes(role)) return res.status(403).json({ error: 'This account does not have that role.' });

    sessionManager.update(req.sessionId, { role, teacherAccount: user.username, source: 'teacher-login' });
    return res.json({ authenticated: true, role, roles, username: user.username });
  });

  router.post('/logout', (req, res) => {
    sessionManager.update(req.sessionId, { role: 'student', teacherAccount: '', source: 'http' });
    return res.json({ authenticated: false, role: 'student', roles: [] });
  });

  return router;
}

module.exports = createAuthRouter;
