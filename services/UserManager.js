const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * UserManager - In-Memory session storage with file persistence
 * Εφαρμογή 1: Simple, no database required
 * 
 * Αποθηκεύει:
 * - Session IDs (UUID)
 * - User data per app (Fourier Lab, Geometry Live, Buffon Needle, Neural Lab)
 * - Last activity timestamp
 * - User metadata (created, last seen)
 */
class UserManager {
    constructor() {
        this.users = new Map();
        this.lastHeartbeatPersist = new Map();
        this.lastSaveErrorAt = 0;
        this.dataDir = path.join(__dirname, '..', 'data');
        this.usersFile = path.join(this.dataDir, 'users.json');
        
        // Δημιουργία data directory αν δεν υπάρχει
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        // Φόρτωση υπάρχοντων δεδομένων
        this.loadFromFile();
    }

    /**
     * Δημιουργία νέας session για χρήστη
     * @param {string} userId - Αναγνωριστικό χρήστη (optional - θα δημιουργηθεί αν δεν υπάρχει)
     * @param {object} initialData - Αρχικά δεδομένα χρήστη
     * @returns {object} Session object με sessionId
     */
    createSession(userId = null, initialData = {}) {
        const sessionId = this.generateSessionId();
        const newUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
            sessionId,
            userId: newUserId,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            apps: {
                'geometry-live': { active: false, data: {} },
                'fourier-lab': { active: false, data: {}, currentSlide: 0 },
                'buffon-needle': { active: false, data: {}, score: 0 },
                'neural-lab': { active: false, data: {} }
            },
            metadata: {
                role: 'student', // student, teacher, admin
                device: 'unknown',
                ipAddress: null,
                ...initialData
            }
        };
        
        this.users.set(sessionId, session);
        this.saveToFile();
        
        return {
            sessionId,
            userId: newUserId,
            createdAt: session.createdAt
        };
    }

    /**
     * Ανάκτηση session
     * @param {string} sessionId
     * @returns {object|null} Session object or null
     */
    getSession(sessionId) {
        const session = this.users.get(sessionId);
        if (session) {
            session.lastActivity = new Date().toISOString();

            // Avoid writing to disk on every single request heartbeat.
            const now = Date.now();
            const lastPersist = this.lastHeartbeatPersist.get(sessionId) || 0;
            if ((now - lastPersist) >= 30 * 1000) {
                this.lastHeartbeatPersist.set(sessionId, now);
                this.saveToFile();
            }
        }
        return session || null;
    }

    /**
     * Ενημέρωση δεδομένων session
     * @param {string} sessionId
     * @param {object} updates
     * @returns {object|null} Updated session or null
     */
    updateSession(sessionId, updates) {
        const session = this.users.get(sessionId);
        if (!session) return null;
        
        Object.assign(session, updates);
        session.lastActivity = new Date().toISOString();
        this.users.set(sessionId, session);
        this.saveToFile();
        
        return session;
    }

    /**
     * Ενημέρωση δεδομένων εφαρμογής για session
     * @param {string} sessionId
     * @param {string} appName - 'geometry-live', 'fourier-lab', etc.
     * @param {object} appData - Δεδομένα εφαρμογής
     * @returns {object|null} Updated session or null
     */
    updateAppData(sessionId, appName, appData) {
        const session = this.users.get(sessionId);
        if (!session) return null;
        
        if (!session.apps[appName]) {
            session.apps[appName] = { active: true, data: {} };
        }
        
        session.apps[appName] = {
            ...session.apps[appName],
            ...appData,
            active: true,
            lastUpdated: new Date().toISOString()
        };
        
        session.lastActivity = new Date().toISOString();
        this.users.set(sessionId, session);
        this.saveToFile();
        
        return session;
    }

    /**
     * Ανάκτηση δεδομένων εφαρμογής
     * @param {string} sessionId
     * @param {string} appName
     * @returns {object|null} App data or null
     */
    getAppData(sessionId, appName) {
        const session = this.getSession(sessionId);
        if (!session || !session.apps[appName]) return null;
        
        return session.apps[appName];
    }

    /**
     * Διαγραφή session
     * @param {string} sessionId
     * @returns {boolean} Success
     */
    deleteSession(sessionId) {
        const deleted = this.users.delete(sessionId);
        if (deleted) {
            this.lastHeartbeatPersist.delete(sessionId);
            this.saveToFile();
        }
        return deleted;
    }

    /**
     * Ανάκτηση όλων των sessions ενός χρήστη
     * @param {string} userId
     * @returns {array} Array of sessions
     */
    getUserSessions(userId) {
        return Array.from(this.users.values())
            .filter(s => s.userId === userId);
    }

    /**
     * Ανάκτηση όλων των ενεργών sessions ανά εφαρμογή
     * @param {string} appName
     * @returns {array} Array of sessions
     */
    getAppSessions(appName) {
        return Array.from(this.users.values())
            .filter(s => s.apps[appName] && s.apps[appName].active);
    }

    /**
     * Ανάκτηση στατιστικών ανά role/app
     * @returns {object} Statistics
     */
    getStatistics() {
        const stats = {
            totalSessions: this.users.size,
            sessionsByRole: { student: 0, teacher: 0, admin: 0 },
            sessionsByApp: {},
            activeSessions: 0,
            totalUsers: new Set(Array.from(this.users.values()).map(s => s.userId)).size
        };
        
        for (const session of this.users.values()) {
            // Count by role
            const role = session.metadata.role || 'student';
            stats.sessionsByRole[role] = (stats.sessionsByRole[role] || 0) + 1;
            
            // Count active sessions (last activity < 15 minutes)
            const lastActivity = new Date(session.lastActivity);
            const now = new Date();
            if ((now - lastActivity) < 15 * 60 * 1000) {
                stats.activeSessions++;
            }
            
            // Count by app
            for (const [appName, appData] of Object.entries(session.apps)) {
                if (appData.active) {
                    stats.sessionsByApp[appName] = (stats.sessionsByApp[appName] || 0) + 1;
                }
            }
        }
        
        return stats;
    }

    /**
     * Καθαρισμός παλιών sessions (> 24 hours inactivity)
     */
    cleanupOldSessions(hoursInactive = 24) {
        const now = new Date();
        const cutoff = new Date(now - hoursInactive * 60 * 60 * 1000);
        let cleaned = 0;
        
        for (const [sessionId, session] of this.users.entries()) {
            const lastActivity = new Date(session.lastActivity);
            if (lastActivity < cutoff) {
                this.users.delete(sessionId);
                this.lastHeartbeatPersist.delete(sessionId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.saveToFile();
        }
        
        return cleaned;
    }

    /**
     * Δημιουργία νέου UUID
     * @returns {string} UUID
     */
    generateSessionId() {
        return crypto.randomUUID();
    }

    /**
     * Αποθήκευση δεδομένων σε αρχείο
     * @private
     */
    saveToFile() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }

            const data = JSON.stringify(Array.from(this.users.entries()), null, 2);
            const tempFile = `${this.usersFile}.tmp`;

            // Write to temp first, then atomically replace target.
            fs.writeFileSync(tempFile, data, 'utf-8');
            fs.renameSync(tempFile, this.usersFile);
        } catch (error) {
            // OneDrive/Windows can transiently lock files. Keep runtime healthy and limit log spam.
            const now = Date.now();
            if ((now - this.lastSaveErrorAt) > 30 * 1000) {
                this.lastSaveErrorAt = now;
                console.warn('Warning: users persistence temporarily unavailable:', error && error.message ? error.message : error);
            }

            try {
                // Fallback attempt for environments where rename can fail under sync/lock pressure.
                fs.writeFileSync(this.usersFile, JSON.stringify(Array.from(this.users.entries()), null, 2), 'utf-8');
            } catch (_) {
                // Keep running; data remains in-memory and next save attempt may succeed.
            }
        }
    }

    /**
     * Φόρτωση δεδομένων από αρχείο
     * @private
     */
    loadFromFile() {
        try {
            if (fs.existsSync(this.usersFile)) {
                const data = fs.readFileSync(this.usersFile, 'utf-8');
                const parsed = JSON.parse(data);
                
                if (Array.isArray(parsed)) {
                    this.users = new Map(parsed);
                    console.log(`[UserManager] Loaded ${this.users.size} sessions from file`);
                }
            }
        } catch (error) {
            console.error('Error loading users from file:', error);
            this.users = new Map();
        }
    }

    /**
     * Export σε JSON (για backup/admin)
     * @returns {object} All data
     */
    exportData() {
        return {
            exportedAt: new Date().toISOString(),
            totalSessions: this.users.size,
            sessions: Array.from(this.users.entries())
        };
    }

    /**
     * Clear όλα τα δεδομένα (χρησιμοποιήστε με προσοχή)
     */
    clearAll() {
        this.users.clear();
        this.lastHeartbeatPersist.clear();
        try {
            fs.unlinkSync(this.usersFile);
        } catch (e) {}
    }
}

// Singleton instance
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new UserManager();
        }
        return instance;
    },
    UserManager
};
