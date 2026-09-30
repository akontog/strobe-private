const http = require('node:http');
const WebSocket = require('ws');

const { createRealtimeTransport } = require('../utils/realtimeTransport');
const initGeogebraCollab = require('../services/geogebraCollab');
const sessionManager = require('../services/sessionManager');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSession({ role = 'student', userId, username }) {
  const random = Math.random().toString(36).slice(2, 10);
  const sessionId = `test_${Date.now()}_${random}`;
  const safeUserId = userId || `${role}_${random}`;

  sessionManager.create(sessionId, {
    ipAddress: '127.0.0.1',
    userAgent: 'geogebra-collab-test-runner',
    role,
    source: 'protocol-test',
    userId: safeUserId,
    username: username || safeUserId,
    displayName: username || safeUserId
  });

  return {
    sessionId,
    userId: safeUserId,
    role
  };
}

function createClient(baseUrl, session) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(baseUrl, {
      headers: {
        Cookie: `sessionId=${session.sessionId}`
      }
    });

    const state = {
      ws,
      session,
      events: [],
      waiters: []
    };

    function notifyWaiters(eventName, payload) {
      state.waiters = state.waiters.filter((waiter) => {
        if (waiter.eventName !== eventName) {
          return true;
        }

        waiter.resolve(payload);
        return false;
      });
    }

    ws.on('open', () => resolve(state));
    ws.on('error', reject);

    ws.on('message', (raw) => {
      let parsed;
      try {
        parsed = JSON.parse(String(raw));
      } catch (error) {
        return;
      }

      if (!parsed || parsed.event === '__meta') {
        return;
      }

      const eventName = parsed.event;
      const payload = parsed.data;
      state.events.push({ eventName, payload, at: Date.now() });
      notifyWaiters(eventName, payload);
    });
  });
}

function emit(client, event, data) {
  client.ws.send(JSON.stringify({ event, data }));
}

function takeLatest(client, eventName) {
  for (let index = client.events.length - 1; index >= 0; index -= 1) {
    const entry = client.events[index];
    if (entry.eventName === eventName) {
      return entry.payload;
    }
  }
  return null;
}

function waitForEvent(client, eventName, timeoutMs = 1800) {
  const existing = takeLatest(client, eventName);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.waiters = client.waiters.filter((item) => item !== waiter);
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeoutMs);

    const waiter = {
      eventName,
      resolve(payload) {
        clearTimeout(timer);
        resolve(payload);
      }
    };

    client.waiters.push(waiter);
  });
}

function waitForEventAfter(client, eventName, afterIndex, timeoutMs = 1800) {
  const existing = client.events.slice(afterIndex).find((entry) => entry.eventName === eventName);
  if (existing) {
    return Promise.resolve(existing.payload);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.waiters = client.waiters.filter((item) => item !== waiter);
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeoutMs);

    const waiter = {
      eventName,
      resolve(payload) {
        clearTimeout(timer);
        resolve(payload);
      }
    };

    client.waiters.push(waiter);
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runGeogebraCollabProtocolRunner({ verbose = false } = {}) {
  const traces = [];
  const testRows = [];
  const sessions = [];
  const clients = [];

  const io = createRealtimeTransport();
  const geogebra = initGeogebraCollab({
    io,
    recordCommunication: () => {},
    sessionManager
  });

  io.on('connection', (socket) => {
    geogebra.registerSocketHandlers(socket);
  });

  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('ok');
  });

  server.on('upgrade', (request, socket, head) => {
    if (!request.url || !request.url.startsWith('/ws/realtime')) {
      socket.destroy();
      return;
    }

    io.handleUpgrade(request, socket, head);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const wsUrl = `ws://127.0.0.1:${port}/ws/realtime`;

  function addTrace(line) {
    traces.push(line);
    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  async function test(name, fn) {
    try {
      await fn();
      testRows.push({ name, status: 'passed' });
      addTrace(`PASS ${name}`);
    } catch (error) {
      testRows.push({ name, status: 'failed', error: error.message });
      addTrace(`FAIL ${name}: ${error.message}`);
    }
  }

  async function createParticipant(config) {
    const session = createSession(config);
    sessions.push(session);
    const client = await createClient(wsUrl, session);
    clients.push(client);
    return client;
  }

  try {
    const teacher = await createParticipant({ role: 'teacher', userId: 'teacher-main' });
    const owner = await createParticipant({ role: 'student', userId: 'alice' });
    const student = await createParticipant({ role: 'student', userId: 'bob' });
    const lateJoiner = await createParticipant({ role: 'student', userId: 'charlie' });

    const roomId = 'geo-room-1';

    [teacher, owner, student].forEach((client) => emit(client, 'geogebra:join', { roomId }));
    await Promise.all([
      waitForEvent(teacher, 'geogebra:init'),
      waitForEvent(owner, 'geogebra:init'),
      waitForEvent(student, 'geogebra:init')
    ]);

    await test('owner can add object', async () => {
      const teacherStart = teacher.events.length;
      const ownerPermStart = owner.events.length;
      const studentPermStart = student.events.length;

      emit(owner, 'geogebra:add', {
        roomId,
        name: 'A',
        cmd: 'A=(0,0)',
        xml: '<element label="A" />'
      });

      const upsertForTeacher = await waitForEventAfter(teacher, 'geogebra:upsert', teacherStart);
      assert(upsertForTeacher.name === 'A', 'teacher did not receive object A');

      const ownerPerms = await waitForEventAfter(owner, 'geogebra:permissions', ownerPermStart);
      const ownerLocked = new Set(ownerPerms.locked || []);
      assert(!ownerLocked.has('A'), 'owner should not have A locked');

      const studentPerms = await waitForEventAfter(student, 'geogebra:permissions', studentPermStart);
      const studentLocked = new Set(studentPerms.locked || []);
      assert(studentLocked.has('A'), 'student should have A locked');
      assert(ownerPerms.info && ownerPerms.info.A && ownerPerms.info.A.owner === 'alice', 'creator ownership should be recorded for A');
    });

    await test('unauthorized update rejected with rollback', async () => {
      const errStart = student.events.length;

      emit(student, 'geogebra:update', {
        roomId,
        name: 'A',
        cmd: 'A=(4,4)',
        xml: '<element label="A" x="4" y="4" />'
      });

      const err = await waitForEventAfter(student, 'geogebra:error', errStart);
      assert(typeof err.message === 'string' && err.message.length > 0, 'missing error message');

      const rollback = await waitForEventAfter(student, 'geogebra:upsert', errStart);
      assert(rollback.name === 'A', 'rollback was not emitted for A');
      assert(String(rollback.cmd || '').includes('0,0'), 'rollback should keep original command');
    });

    await test('owner grant and revoke editor permissions', async () => {
      const grantStart = student.events.length;
      emit(owner, 'geogebra:grant', {
        roomId,
        name: 'A',
        userId: 'bob'
      });

      const studentPerms = await waitForEventAfter(student, 'geogebra:permissions', grantStart);
      assert(!(studentPerms.locked || []).includes('A'), 'student should edit A after grant');

      const ownerUpdateStart = owner.events.length;
      emit(student, 'geogebra:update', {
        roomId,
        name: 'A',
        cmd: 'A=(2,2)',
        xml: '<element label="A" x="2" y="2" />'
      });

      const upsertForOwner = await waitForEventAfter(owner, 'geogebra:upsert', ownerUpdateStart);
      assert(upsertForOwner.name === 'A', 'granted student update did not broadcast');
      assert(String(upsertForOwner.cmd || '').includes('2,2'), 'granted update did not apply');

      const revokeStart = student.events.length;
      emit(owner, 'geogebra:grant', {
        roomId,
        name: 'A',
        userId: 'bob',
        revoke: true
      });

      const studentPermsAfterRevoke = await waitForEventAfter(student, 'geogebra:permissions', revokeStart);
      assert((studentPermsAfterRevoke.locked || []).includes('A'), 'student should be locked after revoke');
    });

    await test('grant by displayName allows student edit', async () => {
      emit(student, 'geogebra:identity', {
        displayName: 'Bobby'
      });
      await delay(25);

      const grantStart = student.events.length;
      emit(owner, 'geogebra:grant', {
        roomId,
        name: 'A',
        userId: 'Bobby'
      });

      const studentPerms = await waitForEventAfter(student, 'geogebra:permissions', grantStart);
      assert(!(studentPerms.locked || []).includes('A'), 'student should edit A after displayName grant');

      const ownerUpdateStart = owner.events.length;
      emit(student, 'geogebra:update', {
        roomId,
        name: 'A',
        cmd: 'A=(5,5)',
        xml: '<element label="A" x="5" y="5" />'
      });

      const upsertForOwner = await waitForEventAfter(owner, 'geogebra:upsert', ownerUpdateStart);
      assert(String(upsertForOwner.cmd || '').includes('5,5'), 'displayName granted update did not apply');

      const revokeStart = student.events.length;
      emit(owner, 'geogebra:grant', {
        roomId,
        name: 'A',
        userId: 'Bobby',
        revoke: true
      });

      const studentPermsAfterRevoke = await waitForEventAfter(student, 'geogebra:permissions', revokeStart);
      assert((studentPermsAfterRevoke.locked || []).includes('A'), 'student should be locked after displayName revoke');
    });

    await test('teacher can update locked object as elevated role', async () => {
      const ownerStart = owner.events.length;
      emit(teacher, 'geogebra:update', {
        roomId,
        name: 'A',
        cmd: 'A=(7,7)',
        xml: '<element label="A" x="7" y="7" />'
      });

      const ownerUpdate = await waitForEventAfter(owner, 'geogebra:upsert', ownerStart);
      assert(String(ownerUpdate.cmd || '').includes('7,7'), 'teacher update was not accepted');
    });

    await test('point coordinate updates persist even with stale command string', async () => {
      const start = owner.events.length;
      emit(owner, 'geogebra:update', {
        roomId,
        name: 'A',
        cmd: 'A=(0,0)',
        xml: '',
        x: 9,
        y: 4
      });

      const upsertForOwner = await waitForEventAfter(owner, 'geogebra:upsert', start);
      assert(upsertForOwner.name === 'A', 'point update did not broadcast');
      assert(upsertForOwner.x === 9 && upsertForOwner.y === 4, 'point coordinates were not persisted');
    });

    await test('rename and remove keep permission model consistent', async () => {
      const renameStart = student.events.length;
      emit(owner, 'geogebra:rename', {
        roomId,
        name: 'A',
        to: 'A1'
      });

      const renameForStudent = await waitForEventAfter(student, 'geogebra:rename', renameStart);
      assert(renameForStudent.from === 'A' && renameForStudent.to === 'A1', 'rename broadcast mismatch');

      const studentPerms = await waitForEventAfter(student, 'geogebra:permissions', renameStart);
      assert((studentPerms.locked || []).includes('A1'), 'renamed object should stay locked for student');
      assert(!(studentPerms.locked || []).includes('A'), 'old name should not remain in locks');

      const removeStart = teacher.events.length;
      const ownerPermStart = owner.events.length;
      emit(owner, 'geogebra:remove', {
        roomId,
        name: 'A1'
      });

      const removeForTeacher = await waitForEventAfter(teacher, 'geogebra:remove', removeStart);
      assert(removeForTeacher.name === 'A1', 'remove broadcast mismatch');

      const ownerPerms = await waitForEventAfter(owner, 'geogebra:permissions', ownerPermStart);
      assert(!(ownerPerms.info && ownerPerms.info.A1), 'removed object should not appear in permissions');
    });

    await test('late join receives init snapshot', async () => {
      const teacherStart = teacher.events.length;
      emit(owner, 'geogebra:add', {
        roomId,
        name: 'B',
        cmd: 'B=(3,3)',
        xml: '<element label="B" />'
      });
      await waitForEventAfter(teacher, 'geogebra:upsert', teacherStart);

      const joinStart = lateJoiner.events.length;
      emit(lateJoiner, 'geogebra:join', { roomId });
      const init = await waitForEventAfter(lateJoiner, 'geogebra:init', joinStart);
      const names = new Set((init.state || []).map((entry) => entry.name));
      assert(names.has('B'), 'late join init missing object B');

      const latePerms = await waitForEventAfter(lateJoiner, 'geogebra:permissions', joinStart);
      assert((latePerms.locked || []).includes('B'), 'late join should receive locked objects');
    });

    await test('teacher can clear stored room objects', async () => {
      const clearStart = owner.events.length;
      emit(teacher, 'geogebra:clear', { roomId });

      const removeForOwner = await waitForEventAfter(owner, 'geogebra:remove', clearStart);
      assert(removeForOwner.name === 'B', 'teacher clear did not remove B');

      const clearPayload = await waitForEventAfter(student, 'geogebra:clear', clearStart);
      assert(Array.isArray(clearPayload.cleared), 'clear payload missing cleared objects');
      assert(clearPayload.cleared.includes('B') || clearPayload.cleared.includes('A'), 'clear payload should include removed objects');
    });

    await delay(40);
  } finally {
    await Promise.all(
      clients.map((client) => new Promise((resolve) => {
        if (client.ws.readyState === WebSocket.CLOSED) {
          resolve();
          return;
        }
        client.ws.once('close', resolve);
        client.ws.close();
      }))
    );

    await new Promise((resolve) => server.close(resolve));
    sessions.forEach((session) => sessionManager.remove(session.sessionId));
  }

  const failed = testRows.filter((row) => row.status === 'failed');
  return {
    ok: failed.length === 0,
    summary: {
      total: testRows.length,
      passed: testRows.length - failed.length,
      failed: failed.length
    },
    tests: testRows,
    traces
  };
}

module.exports = {
  runGeogebraCollabProtocolRunner
};
