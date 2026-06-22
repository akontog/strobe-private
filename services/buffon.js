
// Buffon app websocket server over the same Node.js process
const { WebSocketServer } = require('ws');

/**
 * Αρχικοποιεί το Buffon WebSocket server
 * @param {Object} deps - Εξαρτήσεις από τον server
 */
function initBuffon(deps) {
  const {
    recordCommunication,
    getUpgradeClientInfo,
    touchBuffonConnection,
    coerceFourierString,
    buffonConnectionMeta, // WeakMap
    httpServer
  } = deps;

  const buffonWss = new WebSocketServer({ noServer: true });
  const buffonStudents = new Map();
  const buffonTeachers = new Set();

function buffonBroadcastTeachers(data) {
  const message = JSON.stringify(data);

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: data && data.type ? `buffon:${data.type}` : 'buffon:broadcast-teachers',
    from: 'server',
    to: 'buffon:teachers',
    payload: data
  });

  buffonTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

function buffonBroadcastStudents(data) {
  const message = JSON.stringify(data);

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: data && data.type ? `buffon:${data.type}` : 'buffon:broadcast-students',
    from: 'server',
    to: 'buffon:students',
    payload: data
  });

  buffonStudents.forEach((_, studentWs) => {
    if (studentWs.readyState === 1) {
      studentWs.send(message);
    }
  });
}

function sendBuffonRoster(target) {
  const list = [...buffonStudents.values()];
  const message = JSON.stringify({ type: 'roster', students: list });

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: 'buffon:roster',
    from: 'server',
    to: target ? 'buffon:single-teacher' : 'buffon:teachers',
    payload: {
      students: list.length
    }
  });

  if (target) {
    if (target.readyState === 1) {
      target.send(message);
    }
    return;
  }

  buffonTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

buffonWss.on('connection', (ws, request) => {
  const connectionInfo = getUpgradeClientInfo(request);

  recordCommunication({
    app: 'buffon',
    direction: 'in',
    event: 'buffon:ws-connect',
    from: connectionInfo.ip || 'unknown',
    to: 'server',
    payload: {
      userAgent: connectionInfo.userAgent || 'unknown'
    }
  });

  buffonConnectionMeta.set(ws, {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: connectionInfo.ip,
    userAgent: connectionInfo.userAgent,
    role: 'unknown',
    name: 'Buffon participant'
  });

  ws.on('message', (raw) => {
    touchBuffonConnection(ws);

    let message;

    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    const meta = buffonConnectionMeta.get(ws) || {};
    recordCommunication({
      app: 'buffon',
      direction: 'in',
      event: message && message.type ? `buffon:${message.type}` : 'buffon:message',
      from: meta.name || meta.ip || 'buffon-client',
      to: 'server',
      payload: message
    });

    if (message.type === 'register_teacher') {
      buffonTeachers.add(ws);
      touchBuffonConnection(ws, {
        role: 'teacher',
        name: coerceFourierString(message.name, 40) || 'Buffon teacher'
      });
      sendBuffonRoster(ws);
      return;
    }

    if (message.type === 'register_student') {
      const team = coerceFourierString(message.team, 40) || 'Buffon student';

      buffonStudents.set(ws, {
        team,
        drops: 0,
        hits: 0,
        piEst: null
      });

      touchBuffonConnection(ws, {
        role: 'client',
        name: team
      });

      sendBuffonRoster();
      return;
    }

    if (message.type === 'update') {
      if (buffonStudents.has(ws)) {
        const state = buffonStudents.get(ws);

        buffonStudents.set(ws, {
          team: state.team,
          drops: message.drops,
          hits: message.hits,
          piEst: message.piEst
        });

        touchBuffonConnection(ws, {
          role: 'client',
          name: state.team
        });

        sendBuffonRoster();
      }
      return;
    }

    if (message.type === 'start_round') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      const parsedTime = Number.parseInt(message.timeSec, 10);
      const timeSec = Number.isInteger(parsedTime)
        ? Math.max(20, Math.min(120, parsedTime))
        : 60;

      const parsedTarget = Number.parseFloat(message.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : 0.005;

      const round = Number.parseInt(message.round, 10) || 1;
      const endAt = Date.now() + timeSec * 1000;

      buffonStudents.forEach((state, studentWs) => {
        buffonStudents.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null
        });
      });

      sendBuffonRoster();

      buffonBroadcastStudents({
        type: 'round_start',
        round,
        timeSec,
        targetError,
        endAt,
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false
        }
      });

      return;
    }

    if (message.type === 'end_round') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      const round = Number.parseInt(message.round, 10) || 1;
      const rawReason = typeof message.reason === 'string' ? message.reason : '';
      const reason = rawReason === 'target_reached' || rawReason === 'manual_stop' || rawReason === 'time_up'
        ? rawReason
        : 'time_up';
      const winnerTeam = typeof message.winnerTeam === 'string' ? message.winnerTeam : '';

      const rankings = Array.isArray(message.rankings)
        ? message.rankings.slice(0, 100).map((entry, index) => {
            const rank = Number.parseInt(entry && entry.rank, 10);
            const points = Number.parseInt(entry && entry.points, 10);
            const parsedError = Number.parseFloat(entry && entry.error);

            return {
              rank: Number.isInteger(rank) && rank > 0 ? rank : index + 1,
              team: typeof (entry && entry.team) === 'string' ? entry.team : '',
              points: Number.isInteger(points) ? points : 0,
              error: Number.isFinite(parsedError) ? parsedError : null
            };
          })
        : [];

      const parsedTarget = Number.parseFloat(message.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : null;

      buffonBroadcastStudents({
        type: 'round_end',
        round,
        reason,
        winnerTeam,
        targetError,
        rankings
      });

      return;
    }

    if (message.type === 'reset_tournament') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      buffonStudents.forEach((state, studentWs) => {
        buffonStudents.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null
        });
      });

      sendBuffonRoster();

      buffonBroadcastStudents({
        type: 'reset_tournament',
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false
        }
      });
    }
  });

  ws.on('close', () => {
    const meta = buffonConnectionMeta.get(ws) || {};
    recordCommunication({
      app: 'buffon',
      direction: 'in',
      event: 'buffon:ws-close',
      from: meta.name || meta.ip || 'buffon-client',
      to: 'server'
    });

    buffonStudents.delete(ws);
    buffonTeachers.delete(ws);
    buffonConnectionMeta.delete(ws);
    sendBuffonRoster();
  });
});

  return {
    buffonWss,
    buffonStudents,
    buffonTeachers
  };
}

module.exports = initBuffon;
