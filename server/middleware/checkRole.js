const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
  try {
    const data = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

function getAuthenticatedUser(req) {
  const username = req.session?.teacherAccount;
  const role = req.session?.role;
  if (!username || !['teacher', 'admin'].includes(role)) return null;

  const user = readUsers().find((entry) => entry.username === username);
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  return roles.includes(role) ? { ...user, roles } : null;
}

function hasRole(req, requestedRole) {
  const user = getAuthenticatedUser(req);
  if (!user) return false;
  if (requestedRole === 'teacher') return user.roles.includes('teacher') && ['teacher', 'admin'].includes(req.session.role);
  return req.session.role === requestedRole && user.roles.includes(requestedRole);
}

function requireAuth(req, res, next) {
  if (!hasRole(req, 'teacher')) return res.status(401).json({ error: 'Teacher login required.' });
  return next();
}

function requireRole(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!allowed.some((role) => hasRole(req, role))) {
      return res.status(403).json({ error: `This route requires one of these roles: ${allowed.join(', ')}.` });
    }
    return next();
  };
}

module.exports = {
  getAuthenticatedUser,
  hasRole,
  requireAuth,
  requireRole
};
