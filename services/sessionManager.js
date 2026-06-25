class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
  }

  create(sessionId, metadata = {}) {
    const id = String(sessionId || '').trim();
    if (!id) {
      return null;
    }

    const existing = this.sessions.get(id);
    if (existing) {
      existing.lastSeenAt = Date.now();
      return existing;
    }

    const username = String(metadata.username || `user-${id.slice(0, 6)}`)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 80) || `user-${id.slice(0, 6)}`;

    const role = String(metadata.role || 'client').trim() || 'client';

    const session = {
      id,
      ip: String(metadata.ip || 'unknown'),
      userAgent: String(metadata.userAgent || 'unknown'),
      username,
      role,
      source: String(metadata.source || 'realtime'),
      activeApps: new Set(),
      appData: {
        geometry: {},
        fourier: {},
        buffon: {},
        neural: {}
      },
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      isActive: true
    };

    this.sessions.set(id, session);

    if (!this.users.has(username)) {
      this.users.set(username, new Set());
    }
    this.users.get(username).add(id);

    return session;
  }

  get(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id) return null;
    return this.sessions.get(id) || null;
  }

  update(sessionId, patch = {}, appDataPatch = null) {
    const session = this.get(sessionId);
    if (!session) {
      return null;
    }

    const prevUsername = session.username;

    if (patch && typeof patch === 'object') {
      if (typeof patch.username === 'string') {
        const nextUsername = patch.username.trim().replace(/\s+/g, ' ').slice(0, 80);
        if (nextUsername) {
          session.username = nextUsername;
        }
      }

      if (typeof patch.role === 'string' && patch.role.trim()) {
        session.role = patch.role.trim();
      }

      if (typeof patch.ip === 'string' && patch.ip.trim()) {
        session.ip = patch.ip.trim();
      }

      if (typeof patch.userAgent === 'string' && patch.userAgent.trim()) {
        session.userAgent = patch.userAgent.trim();
      }

      if (typeof patch.source === 'string' && patch.source.trim()) {
        session.source = patch.source.trim();
      }

      if (typeof patch.isActive === 'boolean') {
        session.isActive = patch.isActive;
      }
    }

    if (appDataPatch && typeof appDataPatch === 'object') {
      Object.keys(appDataPatch).forEach((appName) => {
        const section = appDataPatch[appName];
        if (!section || typeof section !== 'object') {
          return;
        }

        if (!session.appData[appName] || typeof session.appData[appName] !== 'object') {
          session.appData[appName] = {};
        }

        session.appData[appName] = {
          ...session.appData[appName],
          ...section
        };
      });
    }

    if (session.username !== prevUsername) {
      this._moveUserIndex(session.id, prevUsername, session.username);
    }

    session.lastSeenAt = Date.now();
    return session;
  }

  touch(sessionId) {
    const session = this.get(sessionId);
    if (!session) return null;
    session.lastSeenAt = Date.now();
    return session;
  }

  joinApp(sessionId, appName) {
    const session = this.get(sessionId);
    const app = String(appName || '').trim();
    if (!session || !app) {
      return null;
    }

    session.activeApps.add(app);
    session.lastSeenAt = Date.now();
    return session;
  }

  leaveApp(sessionId, appName) {
    const session = this.get(sessionId);
    const app = String(appName || '').trim();
    if (!session || !app) {
      return null;
    }

    session.activeApps.delete(app);
    session.lastSeenAt = Date.now();
    return session;
  }

  getParticipants() {
    const list = [];

    this.sessions.forEach((session) => {
      if (!session || !session.isActive) {
        return;
      }

      list.push({
        sessionId: session.id,
        username: session.username,
        displayName: session.username,
        role: session.role,
        source: session.source,
        apps: [...session.activeApps],
        ip: session.ip,
        userAgent: session.userAgent,
        loginAt: new Date(session.connectedAt).toISOString(),
        lastSeen: new Date(session.lastSeenAt).toISOString()
      });
    });

    return list.sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
  }

  getStats() {
    const stats = {
      totalSessions: 0,
      activeSessions: 0,
      totalUsers: this.users.size,
      byRole: {},
      byApp: {},
      byAppRole: {}
    };

    this.sessions.forEach((session) => {
      stats.totalSessions += 1;
      if (!session || !session.isActive) {
        return;
      }

      stats.activeSessions += 1;
      const role = String(session.role || 'unknown');
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;

      session.activeApps.forEach((app) => {
        stats.byApp[app] = (stats.byApp[app] || 0) + 1;
        const appRoleKey = `${app}:${role}`;
        stats.byAppRole[appRoleKey] = (stats.byAppRole[appRoleKey] || 0) + 1;
      });
    });

    return stats;
  }

  remove(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id) return;

    const session = this.sessions.get(id);
    if (!session) {
      return;
    }

    const userSessions = this.users.get(session.username);
    if (userSessions) {
      userSessions.delete(id);
      if (!userSessions.size) {
        this.users.delete(session.username);
      }
    }

    this.sessions.delete(id);
  }

  _moveUserIndex(sessionId, prevUsername, nextUsername) {
    if (prevUsername === nextUsername) {
      return;
    }

    const prevSet = this.users.get(prevUsername);
    if (prevSet) {
      prevSet.delete(sessionId);
      if (!prevSet.size) {
        this.users.delete(prevUsername);
      }
    }

    if (!this.users.has(nextUsername)) {
      this.users.set(nextUsername, new Set());
    }

    this.users.get(nextUsername).add(sessionId);
  }
}

module.exports = new SessionManager();
