const { sanitizeString } = require('../utils/helpers');

const ROOM_EVENT = 'geogebra:join';
const ELEVATED_ROLES = new Set(['teacher', 'admin']);

function initGeogebraCollab({ io, recordCommunication, sessionManager, geogebraLessonStore }) {
  const rooms = new Map();
  const socketRoom = new Map();
  const monitorSockets = new Set();
  const activityFeed = [];

  function cleanColor(value) {
    const normalized = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : '';
  }

  function pushFeed(entry) {
    const record = {
      ...entry,
      at: Date.now()
    };

    activityFeed.unshift(record);
    if (activityFeed.length > 120) {
      activityFeed.pop();
    }

    monitorSockets.forEach((socket) => {
      if (!socket || !socket.connected) {
        monitorSockets.delete(socket);
        return;
      }

      socket.emit('geogebra:monitor:event', record);
    });
  }

  function buildRoomSnapshot(room) {
    const objects = [];
    const members = [];

    room.state.forEach((value, name) => {
      const perm = room.perms.get(name);
      objects.push({
        name,
        cmd: value.cmd || '',
        value: Number.isFinite(value.value) ? value.value : null,
        owner: perm ? perm.owner : null,
        editors: perm ? [...perm.editors] : []
      });
    });

    room.membersMeta.forEach((member) => {
      members.push({
        socketId: member.socketId,
        userId: member.userId,
        displayName: member.displayName,
        color: member.color,
        role: member.role,
        roomId: member.roomId
      });
    });

    return {
      id: room.id,
      members: room.members.size,
      memberList: members,
      objects,
      objectCount: objects.length
    };
  }

  function buildMonitorSnapshot() {
    const roomsSnapshot = [...rooms.values()].map(buildRoomSnapshot).sort((a, b) => a.id.localeCompare(b.id));

    return {
      rooms: roomsSnapshot,
      feed: [...activityFeed]
    };
  }

  function broadcastMonitorSnapshot() {
    const snapshot = buildMonitorSnapshot();
    monitorSockets.forEach((socket) => {
      if (!socket || !socket.connected) {
        monitorSockets.delete(socket);
        return;
      }

      socket.emit('geogebra:monitor:snapshot', snapshot);
    });
  }

  function log(direction, event, from, to, payload) {
    if (typeof recordCommunication !== 'function') {
      return;
    }

    recordCommunication({
      app: 'geogebra',
      direction,
      event,
      from,
      to,
      payload
    });
  }

  function cleanRoomId(value) {
    const cleaned = sanitizeString(value || 'geogebra-default', 80);
    return cleaned || 'geogebra-default';
  }

  function cleanObjectName(value) {
    return sanitizeString(value || '', 120);
  }

  function getRoom(roomId) {
    const key = cleanRoomId(roomId);
    if (!rooms.has(key)) {
      rooms.set(key, {
        id: key,
        state: new Map(),
        perms: new Map(),
        members: new Set(),
        membersMeta: new Map()
      });
    }

    return rooms.get(key);
  }

  function bootstrapRoomFromLesson(room) {
    if (
      !room
      || room.members.size > 0
      || !geogebraLessonStore
      || typeof geogebraLessonStore.getByRoomId !== 'function'
    ) {
      return false;
    }

    const lesson = geogebraLessonStore.getByRoomId(room.id);
    if (!lesson || !lesson.state || typeof lesson.state !== 'object') {
      return false;
    }

    room.state.clear();
    room.perms.clear();

    Object.entries(lesson.state).forEach(([name, value]) => {
      const objectName = cleanObjectName(name);
      if (!objectName || !value || typeof value !== 'object') {
        return;
      }

      const cmd = sanitizeString(value.cmd, 3000) || '';
      const xml = typeof value.xml === 'string' ? value.xml : '';
      room.state.set(objectName, { cmd, xml });
    });

    Object.keys(lesson.state).forEach((name) => {
      const objectName = cleanObjectName(name);
      if (!objectName) {
        return;
      }

      const rawPerm = lesson.perms && lesson.perms[objectName];
      const owner = sanitizeString(rawPerm && rawPerm.owner, 120)
        || sanitizeString(lesson.createdBy, 120)
        || 'system';
      const editors = new Set(
        Array.isArray(rawPerm && rawPerm.editors)
          ? rawPerm.editors
            .map((entry) => sanitizeString(entry, 120))
            .filter(Boolean)
          : []
      );

      room.perms.set(objectName, { owner, editors });
    });

    publishStateChange(room, 'lesson-bootstrap', {
      lessonId: lesson.id,
      by: lesson.createdBy || 'system',
      objectCount: room.state.size
    });

    return true;
  }

  function getUserFromSocket(socket) {
    const session = sessionManager.get(socket.sessionId);
    const role = String((session && session.role) || 'student').trim().toLowerCase() || 'student';
    const id = String((session && session.userId) || socket.userId || socket.sessionId || socket.id).trim();
    return {
      id,
      role,
      sessionId: socket.sessionId,
      socketId: socket.id
    };
  }

  function isElevated(user) {
    return user && ELEVATED_ROLES.has(String(user.role || '').toLowerCase());
  }

  function canEdit(room, user, objectName) {
    if (!room || !user || !objectName) {
      return false;
    }

    const perm = room.perms.get(objectName);
    if (!perm) {
      return true;
    }

    if (isElevated(user)) {
      return true;
    }

    if (perm.owner === user.displayName || perm.owner === user.id) {
      return true;
    }

    if (perm.editors.has('*')) {
      return true;
    }

    return perm.editors.has(user.displayName) || perm.editors.has(user.id);
  }

  function buildPermissionsInfo(room) {
    const info = {};

    room.perms.forEach((perm, name) => {
      info[name] = {
        owner: perm.owner,
        editors: [...perm.editors]
      };
    });

    return info;
  }

  function updateMemberMeta(room, socket, patch = {}) {
    const current = room.membersMeta.get(socket.id) || {
      socketId: socket.id,
      userId: socket.userId || socket.sessionId || socket.id,
      displayName: patch.displayName || socket.userId || socket.sessionId || socket.id,
      color: patch.color || '',
      role: patch.role || 'student',
      roomId: room.id
    };

    const next = {
      ...current,
      ...patch,
      socketId: socket.id,
      roomId: room.id,
      color: cleanColor(patch.color) || current.color || '',
      displayName: sanitizeString(patch.displayName || current.displayName || current.userId || socket.id, 80) || current.displayName || current.userId || socket.id
    };

    room.membersMeta.set(socket.id, next);
    return next;
  }

  function buildInitState(room) {
    const entries = [];

    room.state.forEach((objectValue, name) => {
      const perm = room.perms.get(name);
      entries.push({
        name,
        cmd: objectValue.cmd || '',
        xml: objectValue.xml || '',
        value: Number.isFinite(objectValue.value) ? objectValue.value : null,
        owner: perm ? perm.owner : null,
        editors: perm ? [...perm.editors] : []
      });
    });

    return entries;
  }

  function sendPermissionsToSocket(room, socket, user) {
    const locked = [];
    room.perms.forEach((_, name) => {
      if (!canEdit(room, user, name)) {
        locked.push(name);
      }
    });

    const payload = {
      locked,
      info: buildPermissionsInfo(room)
    };

    socket.emit('geogebra:permissions', payload);
    log('out', 'geogebra:permissions', 'server', socket.id, {
      roomId: room.id,
      lockedCount: locked.length
    });
  }

  function broadcastPermissions(room) {
    room.members.forEach((memberSocket) => {
      if (!memberSocket || !memberSocket.connected) {
        room.members.delete(memberSocket);
        return;
      }

      sendPermissionsToSocket(room, memberSocket, getUserFromSocket(memberSocket));
    });
  }

  function publishStateChange(room, action, details = {}) {
    const snapshot = buildRoomSnapshot(room);
    const payload = {
      roomId: room.id,
      action,
      ...details,
      snapshot
    };

    pushFeed(payload);
    broadcastMonitorSnapshot();
  }

  function sendRollback(room, socket, objectName, reasonText) {
    const existing = room.state.get(objectName);
    if (existing) {
      socket.emit('geogebra:upsert', {
        name: objectName,
        cmd: existing.cmd || '',
        xml: existing.xml || ''
      });
      log('out', 'geogebra:upsert', 'server', socket.id, {
        roomId: room.id,
        name: objectName,
        rollback: true
      });
    } else {
      socket.emit('geogebra:remove', { name: objectName });
      log('out', 'geogebra:remove', 'server', socket.id, {
        roomId: room.id,
        name: objectName,
        rollback: true
      });
    }

    socket.emit('geogebra:error', { message: reasonText || 'Απόρριψη αλλαγής.' });
    log('out', 'geogebra:error', 'server', socket.id, {
      roomId: room.id,
      name: objectName,
      message: reasonText || 'Απόρριψη αλλαγής.'
    });
  }

  function ensurePermissionEntry(room, name, ownerId) {
    if (room.perms.has(name)) {
      return room.perms.get(name);
    }

    const perm = {
      owner: ownerId,
      editors: new Set()
    };

    room.perms.set(name, perm);
    return perm;
  }

  function emitToRoom(room, event, payload) {
    io.to(room.id).emit(event, payload);
    log('out', event, 'server', `room:${room.id}`, {
      roomId: room.id,
      ...payload
    });
  }

  function handleAdd(room, socket, user, data) {
    const name = cleanObjectName(data && data.name);
    if (!name) {
      return;
    }

    if (room.state.has(name)) {
      handleUpdate(room, socket, user, data);
      return;
    }

    const cmd = sanitizeString(data && data.cmd, 3000);
    const xml = typeof (data && data.xml) === 'string' ? data.xml : '';
    const value = Number.isFinite(Number(data && data.value)) ? Number(data.value) : null;

    const ownerId = user.displayName || user.id;

    room.state.set(name, {
      cmd,
      xml,
      value
    });

    room.perms.set(name, {
      owner: ownerId,
      editors: new Set()
    });

    emitToRoom(room, 'geogebra:upsert', { name, cmd, xml, value });
    broadcastPermissions(room);
    publishStateChange(room, 'add', {
      object: name,
      by: ownerId,
      cmd
    });
  }

  function handleUpdate(room, socket, user, data) {
    const name = cleanObjectName(data && data.name);
    if (!name) {
      return;
    }

    if (!room.state.has(name)) {
      handleAdd(room, socket, user, data);
      return;
    }

    if (!canEdit(room, user, name)) {
      sendRollback(room, socket, name, 'Δεν έχεις δικαίωμα επεξεργασίας για αυτό το αντικείμενο.');
      return;
    }

    const previous = room.state.get(name);
    const xml = typeof (data && data.xml) === 'string' ? data.xml : previous.xml || '';
    const cmd = sanitizeString(data && data.cmd, 3000) || previous.cmd || '';
    const value = Number.isFinite(Number(data && data.value))
      ? Number(data.value)
      : (Number.isFinite(previous.value) ? previous.value : null);

    room.state.set(name, {
      cmd,
      xml,
      value
    });

    emitToRoom(room, 'geogebra:upsert', { name, cmd, xml, value });
    publishStateChange(room, 'update', {
      object: name,
      by: user.displayName || user.id,
      cmd
    });
  }

  function handleRemove(room, socket, user, data) {
    const name = cleanObjectName(data && data.name);
    if (!name || !room.state.has(name)) {
      return;
    }

    if (!canEdit(room, user, name)) {
      sendRollback(room, socket, name, 'Δεν έχεις δικαίωμα διαγραφής για αυτό το αντικείμενο.');
      return;
    }

    room.state.delete(name);
    room.perms.delete(name);

    emitToRoom(room, 'geogebra:remove', { name });
    broadcastPermissions(room);
    publishStateChange(room, 'remove', {
      object: name,
      by: user.displayName || user.id
    });
  }

  function handleRename(room, socket, user, data) {
    const from = cleanObjectName(data && data.name);
    const to = cleanObjectName(data && data.to);

    if (!from || !to || from === to || !room.state.has(from) || room.state.has(to)) {
      return;
    }

    if (!canEdit(room, user, from)) {
      sendRollback(room, socket, from, 'Δεν έχεις δικαίωμα μετονομασίας για αυτό το αντικείμενο.');
      return;
    }

    const value = room.state.get(from);
    room.state.delete(from);
    room.state.set(to, value);

    if (room.perms.has(from)) {
      const perm = room.perms.get(from);
      room.perms.delete(from);
      room.perms.set(to, perm);
    }

    emitToRoom(room, 'geogebra:rename', { from, to });
    broadcastPermissions(room);
    publishStateChange(room, 'rename', {
      object: from,
      to,
      by: user.displayName || user.id
    });
  }

  function handleGrant(room, socket, user, data) {
    const name = cleanObjectName(data && data.name);
    const targetUserId = sanitizeString(data && data.userId, 120);
    const revoke = Boolean(data && data.revoke);

    if (!name || !targetUserId || !room.state.has(name)) {
      return;
    }

    const ownerId = user.displayName || user.id;
    const perm = ensurePermissionEntry(room, name, ownerId);
    const canGrant = isElevated(user) || perm.owner === ownerId || perm.owner === user.id;

    if (!canGrant) {
      socket.emit('geogebra:error', { message: 'Μόνο owner ή teacher/admin μπορεί να αλλάξει δικαιώματα.' });
      log('out', 'geogebra:error', 'server', socket.id, {
        roomId: room.id,
        name,
        message: 'Μόνο owner ή teacher/admin μπορεί να αλλάξει δικαιώματα.'
      });
      return;
    }

    if (revoke) {
      perm.editors.delete(targetUserId);
    } else if (targetUserId !== perm.owner) {
      perm.editors.add(targetUserId);
    }

    broadcastPermissions(room);
    publishStateChange(room, revoke ? 'revoke' : 'grant', {
      object: name,
      by: ownerId,
      targetUserId
    });
  }

  function handleJoin(socket, data) {
    const roomId = cleanRoomId(data && data.roomId);
    const prevRoomId = socketRoom.get(socket.id);

    if (prevRoomId && prevRoomId !== roomId) {
      const prevRoom = getRoom(prevRoomId);
      prevRoom.members.delete(socket);
      socket.leave(prevRoomId);
    }

    socketRoom.set(socket.id, roomId);
    socket.join(roomId);

    const room = getRoom(roomId);
    bootstrapRoomFromLesson(room);
    room.members.add(socket);

    const user = getUserFromSocket(socket);
    const member = updateMemberMeta(room, socket, {
      displayName: data && data.displayName,
      color: data && data.color,
      role: user.role,
      userId: user.id
    });

    publishStateChange(room, 'join', {
      by: member.displayName,
      role: user.role,
      userId: user.id
    });

    socket.emit('geogebra:init', {
      me: {
        id: member.displayName,
        role: user.role,
        displayName: member.displayName,
        color: member.color
      },
      state: buildInitState(room)
    });

    log('out', 'geogebra:init', 'server', socket.id, {
      roomId,
      objectCount: room.state.size
    });

    sendPermissionsToSocket(room, socket, user);
  }

  function routeEvent(socket, eventName, payload, handler) {
    socket.on(eventName, (data) => {
      const currentRoomId = socketRoom.get(socket.id) || cleanRoomId(data && data.roomId);
      if (!currentRoomId) {
        return;
      }

      if (!socketRoom.has(socket.id)) {
        handleJoin(socket, { roomId: currentRoomId });
      }

      const room = getRoom(currentRoomId);
      const user = getUserFromSocket(socket);

      log('in', eventName, socket.id, 'server', {
        roomId: room.id,
        payload
      });

      handler(room, socket, user, data || {});
    });
  }

  function registerSocketHandlers(socket) {
    socket.on(ROOM_EVENT, (data) => {
      handleJoin(socket, data || {});
    });

    socket.on('geogebra:monitor:join', () => {
      monitorSockets.add(socket);
      socket.emit('geogebra:monitor:snapshot', buildMonitorSnapshot());
    });

    socket.on('geogebra:monitor:leave', () => {
      monitorSockets.delete(socket);
    });

    socket.on('geogebra:identity', (data) => {
      const roomId = socketRoom.get(socket.id);
      if (!roomId) {
        return;
      }

      const room = getRoom(roomId);
      const member = updateMemberMeta(room, socket, {
        displayName: data && data.displayName,
        color: data && data.color
      });

      publishStateChange(room, 'identity', {
        by: member.displayName,
        userId: member.userId
      });
    });

    routeEvent(socket, 'geogebra:add', 'add', handleAdd);
    routeEvent(socket, 'geogebra:update', 'update', handleUpdate);
    routeEvent(socket, 'geogebra:remove', 'remove', handleRemove);
    routeEvent(socket, 'geogebra:rename', 'rename', handleRename);
    routeEvent(socket, 'geogebra:grant', 'grant', handleGrant);

    socket.on('disconnect', () => {
      const roomId = socketRoom.get(socket.id);
      socketRoom.delete(socket.id);
      monitorSockets.delete(socket);

      if (!roomId) {
        return;
      }

      const room = getRoom(roomId);
      room.members.delete(socket);
      room.membersMeta.delete(socket.id);
    });
  }

  return {
    registerSocketHandlers,
    canEdit
  };
}

module.exports = initGeogebraCollab;
