const activeSessions = new Map();

function extractIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function markLogin({ sessionId, user, req }) {
  if (!sessionId || !user) {
    return;
  }

  const now = new Date().toISOString();

  activeSessions.set(sessionId, {
    sessionId,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    loginAt: now,
    lastSeen: now,
    ip: extractIp(req),
    userAgent: req.headers['user-agent'] || 'unknown'
  });
}

function touchSession(sessionId) {
  if (!sessionId || !activeSessions.has(sessionId)) {
    return;
  }

  const current = activeSessions.get(sessionId);
  activeSessions.set(sessionId, {
    ...current,
    lastSeen: new Date().toISOString()
  });
}

function markLogout(sessionId) {
  if (!sessionId) {
    return;
  }

  activeSessions.delete(sessionId);
}

function listActiveSessions() {
  return Array.from(activeSessions.values()).sort((a, b) => {
    return String(b.lastSeen).localeCompare(String(a.lastSeen));
  });
}

function getSessionStats() {
  const sessions = listActiveSessions();
  const byRole = sessions.reduce((acc, session) => {
    const role = session.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    total: sessions.length,
    byRole
  };
}

module.exports = {
  markLogin,
  touchSession,
  markLogout,
  listActiveSessions,
  getSessionStats
};
