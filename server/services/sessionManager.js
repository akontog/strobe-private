const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SessionManager {
  // Αρχικοποιεί in-memory indexes και φορτώνει persisted sessions από δίσκο.
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
    this.lastSaveErrorAt = 0;
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.dataFile = path.join(this.dataDir, 'users.json');
    this.loadFromFile();
  }

  // Δημιουργεί/ενεργοποιεί session με συγκεκριμένο id (χρήσιμο για ws/realtime ids).
  create(sessionId, metadata = {}) {
    const id = String(sessionId || '').trim();
    if (!id) {
      return null;
    }

    const existing = this.sessions.get(id);
    if (existing) {
      existing.lastSeenAt = Date.now();
      existing.isActive = true;
      return existing;
    }

    const username = this._normalizeUsername(metadata.username, id);
    const role = String(metadata.role || 'client').trim() || 'client';
    const now = Date.now();

    const session = {
      id,
      userId: String(metadata.userId || `user_${id.slice(0, 6)}`),
      ip: String(metadata.ip || metadata.ipAddress || 'unknown'),
      userAgent: String(metadata.userAgent || 'unknown'),
      username,
      role,
      source: String(metadata.source || 'realtime'),
      activeApps: new Set(),
      appData: {},
      connectedAt: now,
      lastSeenAt: now,
      isActive: true
    };

    this.sessions.set(id, session);
    this._addUserIndex(username, id);
    this.saveToFile();
    return session;
  }

  // Δημιουργεί νέο session με αυτόματα παραγόμενο uuid για HTTP middleware.
  createWithGeneratedId(userId = null, initialData = {}) {
    const sessionId = crypto.randomUUID();
    const session = this.create(sessionId, {
      userId: userId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      username: initialData.username,
      role: initialData.role || 'student',
      source: initialData.source || 'http',
      ipAddress: initialData.ipAddress,
      userAgent: initialData.userAgent
    });

    return {
      sessionId: session.id,
      userId: session.userId,
      createdAt: new Date(session.connectedAt).toISOString()
    };
  }

  // Επιστρέφει raw session object από το in-memory store.
  get(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id) return null;
    return this.sessions.get(id) || null;
  }

  // Ενημερώνει metadata και προαιρετικά app-data sections για ένα session.
  update(sessionId, patch = {}, appDataPatch = null) {
    const session = this.get(sessionId);
    if (!session) {
      return null;
    }

    const prevUsername = session.username;

    if (patch && typeof patch === 'object') {
      if (typeof patch.username === 'string') {
        const nextUsername = this._normalizeUsername(patch.username, session.id);
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
        this.saveAppData(session.id, appName, appDataPatch[appName]);
      });
    }

    if (session.username !== prevUsername) {
      this._moveUserIndex(session.id, prevUsername, session.username);
    }

    session.lastSeenAt = Date.now();
    this.saveToFile();
    return session;
  }

  // Ανανεώνει το lastSeenAt timestamp χωρίς άλλο mutation.
  touch(sessionId) {
    const session = this.get(sessionId);
    if (!session) return null;
    session.lastSeenAt = Date.now();
    return session;
  }

  // Συνδέει session με app για active participation/stats.
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

  // Αφαιρεί app από το active app set του session.
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

  // Κάνει merge app-specific state και το επιμένει στο store.
  saveAppData(sessionId, appName, appData) {
    const session = this.get(sessionId);
    const app = String(appName || '').trim();
    if (!session || !app) {
      return null;
    }

    if (!session.appData[app] || typeof session.appData[app] !== 'object') {
      session.appData[app] = {};
    }

    const patch = appData && typeof appData === 'object' ? appData : {};
    session.appData[app] = {
      ...session.appData[app],
      ...patch,
      active: true,
      lastUpdated: new Date().toISOString()
    };
    session.activeApps.add(app);
    session.lastSeenAt = Date.now();
    this.saveToFile();
    return session.appData[app];
  }

  // Επιστρέφει app-specific state για ένα session/app pair.
  getAppData(sessionId, appName) {
    const session = this.get(sessionId);
    const app = String(appName || '').trim();
    if (!session || !app) {
      return null;
    }

    return session.appData[app] || null;
  }

  // Παράγει normalized participant list για admin/realtime monitoring.
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

  // Υπολογίζει συγκεντρωτικά στατιστικά για dashboard/admin endpoints.
  getStatistics() {
    const stats = {
      totalSessions: 0,
      activeSessions: 0,
      totalUsers: this.users.size,
      sessionsByRole: {},
      sessionsByApp: {},
      byAppRole: {}
    };

    this.sessions.forEach((session) => {
      stats.totalSessions += 1;
      if (!session || !session.isActive) {
        return;
      }

      stats.activeSessions += 1;
      const role = String(session.role || 'unknown');
      stats.sessionsByRole[role] = (stats.sessionsByRole[role] || 0) + 1;

      session.activeApps.forEach((app) => {
        stats.sessionsByApp[app] = (stats.sessionsByApp[app] || 0) + 1;
        const appRoleKey = `${app}:${role}`;
        stats.byAppRole[appRoleKey] = (stats.byAppRole[appRoleKey] || 0) + 1;
      });
    });

    return {
      totalSessions: stats.totalSessions,
      activeSessions: stats.activeSessions,
      totalUsers: stats.totalUsers,
      sessionsByRole: stats.sessionsByRole,
      sessionsByApp: stats.sessionsByApp,
      byAppRole: stats.byAppRole
    };
  }

  // Διαγράφει sessions που είναι ανενεργά για πάνω από X ώρες.
  cleanupOldSessions(hoursInactive = 24) {
    const safeHours = Number.isFinite(Number(hoursInactive))
      ? Math.max(1, Number(hoursInactive))
      : 24;
    const cutoff = Date.now() - safeHours * 60 * 60 * 1000;
    let cleaned = 0;

    [...this.sessions.values()].forEach((session) => {
      if (!session) {
        return;
      }

      if (Number(session.lastSeenAt) < cutoff) {
        this.remove(session.id);
        cleaned += 1;
      }
    });

    if (cleaned > 0) {
      this.saveToFile();
    }

    return cleaned;
  }

  // Αφαιρεί οριστικά session από indexes και persistence.
  remove(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id) return false;

    const session = this.sessions.get(id);
    if (!session) {
      return false;
    }

    const userSessions = this.users.get(session.username);
    if (userSessions) {
      userSessions.delete(id);
      if (!userSessions.size) {
        this.users.delete(session.username);
      }
    }

    this.sessions.delete(id);
    this.saveToFile();
    return true;
  }

  // Αποθηκεύει atomically όλα τα sessions σε αρχείο json.
  saveToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const payload = {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        sessions: [...this.sessions.values()].map((session) => ({
          ...session,
          activeApps: [...session.activeApps]
        }))
      };

      const tempFile = `${this.dataFile}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, this.dataFile);
    } catch (error) {
      const now = Date.now();
      if ((now - this.lastSaveErrorAt) > 30 * 1000) {
        this.lastSaveErrorAt = now;
        console.warn('Warning: session persistence temporarily unavailable:', error && error.message ? error.message : error);
      }
    }
  }

  // Φορτώνει sessions από νέο schema ή από legacy users map μορφή.
  loadFromFile() {
    this.sessions = new Map();
    this.users = new Map();

    try {
      if (!fs.existsSync(this.dataFile)) {
        return;
      }

      const raw = fs.readFileSync(this.dataFile, 'utf-8');
      const parsed = JSON.parse(raw);

      const candidates = Array.isArray(parsed)
        ? this._fromLegacyMapEntries(parsed)
        : Array.isArray(parsed && parsed.sessions)
          ? parsed.sessions
          : [];

      candidates.forEach((item) => {
        const normalized = this._normalizePersistedSession(item);
        if (!normalized) {
          return;
        }

        this.sessions.set(normalized.id, normalized);
        this._addUserIndex(normalized.username, normalized.id);
      });

      console.log(`[SessionManager] Loaded ${this.sessions.size} sessions from file`);
    } catch (error) {
      console.error('Error loading sessions from file:', error && error.message ? error.message : error);
      this.sessions = new Map();
      this.users = new Map();
    }
  }

  // Μετατρέπει legacy UserManager map entries σε normalized candidate sessions.
  _fromLegacyMapEntries(entries) {
    return entries
      .map((entry) => {
        if (!Array.isArray(entry) || entry.length < 2) {
          return null;
        }

        const [legacyId, legacy] = entry;
        if (!legacy || typeof legacy !== 'object') {
          return null;
        }

        const apps = legacy.apps && typeof legacy.apps === 'object' ? legacy.apps : {};
        const appData = {};
        const activeApps = [];

        Object.keys(apps).forEach((app) => {
          const value = apps[app];
          if (!value || typeof value !== 'object') {
            return;
          }

          appData[app] = { ...value };
          if (value.active) {
            activeApps.push(app);
          }
        });

        return {
          id: String(legacy.sessionId || legacyId || '').trim(),
          userId: String(legacy.userId || `user_${String(legacyId || '').slice(0, 6)}`),
          ip: String((legacy.metadata && legacy.metadata.ipAddress) || 'unknown'),
          userAgent: String((legacy.metadata && legacy.metadata.userAgent) || 'unknown'),
          username: String((legacy.metadata && legacy.metadata.displayName) || (legacy.metadata && legacy.metadata.username) || legacy.userId || `user_${String(legacyId || '').slice(0, 6)}`),
          role: String((legacy.metadata && legacy.metadata.role) || 'student'),
          source: 'legacy',
          activeApps,
          appData,
          connectedAt: Date.parse(legacy.createdAt || '') || Date.now(),
          lastSeenAt: Date.parse(legacy.lastActivity || '') || Date.now(),
          isActive: true
        };
      })
      .filter(Boolean);
  }

  // Εξασφαλίζει έγκυρο persisted session shape πριν γίνει restore.
  _normalizePersistedSession(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const id = String(item.id || item.sessionId || '').trim();
    if (!id) {
      return null;
    }

    const username = this._normalizeUsername(item.username, id);
    return {
      id,
      userId: String(item.userId || `user_${id.slice(0, 6)}`),
      ip: String(item.ip || 'unknown'),
      userAgent: String(item.userAgent || 'unknown'),
      username,
      role: String(item.role || 'client'),
      source: String(item.source || 'realtime'),
      activeApps: new Set(Array.isArray(item.activeApps) ? item.activeApps : []),
      appData: item.appData && typeof item.appData === 'object' ? item.appData : {},
      connectedAt: Number(item.connectedAt) || Date.now(),
      lastSeenAt: Number(item.lastSeenAt) || Date.now(),
      isActive: item.isActive !== false
    };
  }

  // Καθαρίζει username και εφαρμόζει deterministic fallback.
  _normalizeUsername(value, fallbackId) {
    const cleaned = String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 80);
    return cleaned || `user-${String(fallbackId || '').slice(0, 6)}`;
  }

  // Ενημερώνει το reverse index username -> session ids.
  _addUserIndex(username, sessionId) {
    if (!this.users.has(username)) {
      this.users.set(username, new Set());
    }
    this.users.get(username).add(sessionId);
  }

  // Μετακινεί session id όταν αλλάζει το username key.
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

    this._addUserIndex(nextUsername, sessionId);
  }
}

module.exports = new SessionManager();
