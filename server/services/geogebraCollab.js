const { sanitizeString } = require('../utils/helpers');
const { getAppBySlug } = require('../apps/registry');
const { appendRecord, getActiveSession, getActiveSessionForApp } = require('./sessionLogs');

const ROOM_EVENT = 'geogebra:join';
const ELEVATED_ROLES = new Set(['teacher', 'admin']);

function initGeogebraCollab({ io, recordCommunication, sessionManager, geogebraLessonStore }) {
  const rooms = new Map();
  const socketRoom = new Map();
  const socketSessionApps = new Map();
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

  function clearActivityFeed() {
    activityFeed.length = 0;
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
        x: Number.isFinite(value.x) ? value.x : null,
        y: Number.isFinite(value.y) ? value.y : null,
        owner: perm ? (perm.ownerName || perm.owner) : null,
        ownerId: perm ? (perm.ownerId || null) : null,
        editors: perm ? [...perm.editors] : [],
        editorNames: perm ? { ...(perm.editorNames || {}) } : {}
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

  function normalizeSessionApp(value) {
    const app = sanitizeString(value || '', 80);
    return app === 'geogebra-collab' || getAppBySlug(app) ? app : 'geogebra-collab';
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

      room.perms.set(objectName, { owner, ownerName: owner, ownerId: '', editors, editorNames: {} });
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
    const displayName = sanitizeString(
      (session && (role === 'teacher' ? session.teacherAccount : session.username))
      || (session && session.displayName)
      || (socket && socket.user && socket.user.displayName)
      || (socket && socket.displayName)
      || id,
      80
    );

    return {
      id,
      role,
      sessionId: socket.sessionId,
      socketId: socket.id,
      displayName
    };
  }

  function isElevated(user) {
    return user && ELEVATED_ROLES.has(String(user.role || '').toLowerCase());
  }

  function buildUserAliases(room, user) {
    const aliases = new Set();
    if (!user) {
      return aliases;
    }

    if (user.displayName) {
      aliases.add(String(user.displayName));
    }
    if (user.id) {
      aliases.add(String(user.id));
    }

    const member = room && room.membersMeta && user.socketId ? room.membersMeta.get(user.socketId) : null;
    if (member) {
      if (member.displayName) {
        aliases.add(String(member.displayName));
      }
      if (member.userId) {
        aliases.add(String(member.userId));
      }
      if (member.socketId) {
        aliases.add(String(member.socketId));
      }
    }

    return aliases;
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

    if (perm.ownerId) {
      return perm.ownerId === user.id || perm.editors.has('*') || perm.editors.has(user.id);
    }

    const aliases = buildUserAliases(room, user);

    if ([...aliases].some((alias) => perm.owner === alias)) {
      return true;
    }

    if (perm.editors.has('*')) {
      return true;
    }

    return [...aliases].some((alias) => perm.editors.has(alias));
  }

  function buildPermissionsInfo(room) {
    const info = {};

    room.perms.forEach((perm, name) => {
      info[name] = {
        owner: perm.ownerName || perm.owner,
        ownerId: perm.ownerId || null,
        editors: [...perm.editors],
        editorNames: { ...(perm.editorNames || {}) }
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
        x: Number.isFinite(objectValue.x) ? objectValue.x : null,
        y: Number.isFinite(objectValue.y) ? objectValue.y : null,
        owner: perm ? (perm.ownerName || perm.owner) : null,
        ownerId: perm ? (perm.ownerId || null) : null,
        editors: perm ? [...perm.editors] : [],
        editorNames: perm ? { ...(perm.editorNames || {}) } : {}
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

  function publishStateChange(room, action, details = {}, actor = null) {
    const snapshot = buildRoomSnapshot(room);
    const payload = {
      roomId: room.id,
      action,
      ...details,
      snapshot
    };

    pushFeed(payload);
    broadcastMonitorSnapshot();
    recordSessionAction(room, action, details, actor);
  }

  function recordSessionAction(room, action, details, actor) {
    if (!actor || !actor.socket || !actor.user) return;
    const app = socketSessionApps.get(actor.socket.id) || 'geogebra-collab';
    const sessionId = getActiveSessionForApp(app);
    const session = sessionId ? getActiveSession(sessionId) : null;
    if (!session) return;

    const objectName = details.to || details.object || '';
    const objectValue = objectName ? room.state.get(objectName) : null;
    const permission = objectName ? room.perms.get(objectName) : null;
    const state = objectValue ? {
      name: objectName,
      cmd: objectValue.cmd || '',
      xml: objectValue.xml || '',
      value: Number.isFinite(objectValue.value) ? objectValue.value : null,
      x: Number.isFinite(objectValue.x) ? objectValue.x : null,
      y: Number.isFinite(objectValue.y) ? objectValue.y : null
    } : details.state || null;

    appendRecord(sessionId, 'events.jsonl', {
      event: 'geogebra.action',
      activity: session.metadata.activity || app,
      student: getActorDisplayName(room, actor.socket, actor.user),
      data: {
        roomId: room.id,
        action,
        object: details.object || details.from || objectName || null,
        to: details.to || null,
        target: details.targetName || null,
        state,
        objects: Array.isArray(details.objects) ? details.objects : undefined,
        access: permission ? {
          owner: permission.ownerName || permission.owner,
          editors: [...permission.editors],
          editorNames: { ...(permission.editorNames || {}) }
        } : undefined
      }
    });
  }

  function sendRollback(room, socket, objectName, reasonText) {
    const existing = room.state.get(objectName);
    if (existing) {
      socket.emit('geogebra:upsert', {
        name: objectName,
        cmd: existing.cmd || '',
        xml: existing.xml || '',
        value: Number.isFinite(existing.value) ? existing.value : null,
        x: Number.isFinite(existing.x) ? existing.x : null,
        y: Number.isFinite(existing.y) ? existing.y : null
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

  function ensurePermissionEntry(room, name, ownerId, ownerName) {
    if (room.perms.has(name)) {
      return room.perms.get(name);
    }

    const perm = {
      owner: ownerId,
      ownerId,
      ownerName: ownerName || ownerId,
      editors: new Set(),
      editorNames: {}
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

  function getActorDisplayName(room, socket, user) {
    const member = room.membersMeta.get(socket.id);
    return (member && member.displayName) || user.displayName || user.id;
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
    const x = Number.isFinite(Number(data && data.x)) ? Number(data.x) : null;
    const y = Number.isFinite(Number(data && data.y)) ? Number(data.y) : null;

    const member = room.membersMeta.get(socket.id);
    const ownerId = sanitizeString(user.id, 120) || 'system';
    const ownerName = sanitizeString((member && member.displayName) || user.displayName || ownerId, 80) || ownerId;

    room.state.set(name, {
      cmd,
      xml,
      value,
      x,
      y
    });

    room.perms.set(name, {
      owner: ownerName,
      ownerId,
      ownerName,
      editors: new Set([ownerId]),
      editorNames: { [ownerId]: ownerName }
    });

    emitToRoom(room, 'geogebra:upsert', { name, cmd, xml, value, x, y });
    broadcastPermissions(room);
    publishStateChange(room, 'add', {
      object: name,
      by: ownerName,
      cmd
    }, { socket, user });
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
    const hasPointCoords = Number.isFinite(Number(data && data.x)) && Number.isFinite(Number(data && data.y));
    const xml = hasPointCoords
      ? (previous.xml || '')
      : (typeof (data && data.xml) === 'string' ? data.xml : previous.xml || '');
    const cmd = hasPointCoords
      ? (previous.cmd || sanitizeString(data && data.cmd, 3000) || '')
      : (sanitizeString(data && data.cmd, 3000) || previous.cmd || '');
    const value = Number.isFinite(Number(data && data.value))
      ? Number(data.value)
      : (Number.isFinite(previous.value) ? previous.value : null);
    const x = Number.isFinite(Number(data && data.x))
      ? Number(data.x)
      : (Number.isFinite(previous.x) ? previous.x : null);
    const y = Number.isFinite(Number(data && data.y))
      ? Number(data.y)
      : (Number.isFinite(previous.y) ? previous.y : null);

    room.state.set(name, {
      cmd,
      xml,
      value,
      x,
      y
    });

    emitToRoom(room, 'geogebra:upsert', { name, cmd, xml, value, x, y });
    publishStateChange(room, 'update', {
      object: name,
      by: getActorDisplayName(room, socket, user),
      cmd
    }, { socket, user });
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

    const removedState = room.state.get(name);
    room.state.delete(name);
    room.perms.delete(name);

    emitToRoom(room, 'geogebra:remove', { name });
    broadcastPermissions(room);
    publishStateChange(room, 'remove', {
      object: name,
      by: getActorDisplayName(room, socket, user),
      state: removedState ? { name, ...removedState } : null
    }, { socket, user });
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
      by: getActorDisplayName(room, socket, user)
    }, { socket, user });
  }

  function handleClear(room, socket, user, data) {
    if (!room || !isElevated(user)) {
      socket.emit('geogebra:error', { message: 'Μόνο teacher/admin μπορεί να καθαρίσει το room.' });
      return;
    }

    const objectName = cleanObjectName(data && data.name);
    const removedNames = [];
    const removedObjects = [];

    if (objectName) {
      if (room.state.has(objectName)) {
        removedNames.push(objectName);
        removedObjects.push({ name: objectName, ...room.state.get(objectName) });
        room.state.delete(objectName);
        room.perms.delete(objectName);
      }
    } else {
      room.state.forEach((_, name) => {
        removedNames.push(name);
        removedObjects.push({ name, ...room.state.get(name) });
      });
      room.state.clear();
      room.perms.clear();
    }

    if (removedNames.length === 0) {
      return;
    }

    removedNames.forEach((name) => {
      emitToRoom(room, 'geogebra:remove', { name });
    });
    emitToRoom(room, 'geogebra:clear', {
      roomId: room.id,
      name: objectName || null,
      cleared: removedNames
    });
    broadcastPermissions(room);
    publishStateChange(room, 'clear', {
      by: getActorDisplayName(room, socket, user),
      object: objectName || 'room',
      cleared: removedNames,
      objects: removedObjects
    }, { socket, user });
  }

  function handleGrant(room, socket, user, data) {
    const name = cleanObjectName(data && data.name);
    const targetUserId = sanitizeString(data && data.userId, 120);
    const revoke = Boolean(data && data.revoke);

    if (!name || !targetUserId || !room.state.has(name)) {
      return;
    }

    if (!room.perms.has(name) && !isElevated(user)) {
      return;
    }

    const ownerId = user.id;
    const ownerName = getActorDisplayName(room, socket, user);
    const perm = ensurePermissionEntry(room, name, ownerId, ownerName);
    const actorAliases = buildUserAliases(room, user);
    const canGrant = isElevated(user)
      || (perm.ownerId ? perm.ownerId === user.id : [...actorAliases].some((alias) => perm.owner === alias));

    if (!canGrant) {
      socket.emit('geogebra:error', { message: 'Μόνο owner ή teacher/admin μπορεί να αλλάξει δικαιώματα.' });
      log('out', 'geogebra:error', 'server', socket.id, {
        roomId: room.id,
        name,
        message: 'Μόνο owner ή teacher/admin μπορεί να αλλάξει δικαιώματα.'
      });
      return;
    }

    const members = [...room.membersMeta.values()];
    const targetMember = members.find((member) => (
      member && (member.userId === targetUserId || member.socketId === targetUserId)
    )) || members.find((member) => member && member.displayName === targetUserId);

    const targetAliases = new Set();
    if (targetMember) {
      if (targetMember.userId) {
        targetAliases.add(targetMember.userId);
      }
      if (!perm.ownerId && targetMember.displayName) {
        targetAliases.add(targetMember.displayName);
      }
    } else {
      targetAliases.add(targetUserId);
    }

    if (revoke) {
      targetAliases.forEach((alias) => {
        perm.editors.delete(alias);
        if (perm.editorNames) {
          delete perm.editorNames[alias];
        }
      });
    } else {
      targetAliases.forEach((alias) => {
        if (alias !== perm.owner) {
          perm.editors.add(alias);
          if (targetMember && targetMember.userId === alias) {
            perm.editorNames = perm.editorNames || {};
            perm.editorNames[alias] = targetMember.displayName || alias;
          }
        }
      });
    }

    broadcastPermissions(room);
    publishStateChange(room, revoke ? 'revoke' : 'grant', {
      object: name,
      by: ownerName,
      targetUserId,
      targetName: targetMember && targetMember.displayName
    }, { socket, user });
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
    socketSessionApps.set(socket.id, normalizeSessionApp(data && data.sessionApp));
    socket.join(roomId);

    const room = getRoom(roomId);
    bootstrapRoomFromLesson(room);
    room.members.add(socket);

    const user = getUserFromSocket(socket);
    const member = updateMemberMeta(room, socket, {
      displayName: isElevated(user) ? user.displayName : data && data.displayName,
      color: data && data.color,
      role: user.role,
      userId: user.id
    });

    publishStateChange(room, 'join', {
      by: member.displayName,
      role: user.role,
      userId: user.id
    }, { socket, user });

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
      const requestedRoomId = cleanRoomId(data && data.roomId);
      const joinedRoomId = socketRoom.get(socket.id);
      const currentRoomId = requestedRoomId || joinedRoomId;
      if (!currentRoomId) {
        return;
      }

      if (!joinedRoomId || joinedRoomId !== currentRoomId) {
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

    socket.on('geogebra:monitor:clear-feed', () => {
      const user = getUserFromSocket(socket);
      if (!isElevated(user)) {
        socket.emit('geogebra:error', { message: 'Μόνο teacher/admin μπορεί να καθαρίσει το monitor feed.' });
        return;
      }

      clearActivityFeed();
      broadcastMonitorSnapshot();
    });

    socket.on('geogebra:identity', (data) => {
      const roomId = socketRoom.get(socket.id);
      if (!roomId) {
        return;
      }

      const room = getRoom(roomId);
      const user = getUserFromSocket(socket);
      const member = updateMemberMeta(room, socket, {
        displayName: isElevated(user) ? user.displayName : data && data.displayName,
        color: data && data.color
      });

      publishStateChange(room, 'identity', {
        by: member.displayName,
        userId: member.userId
      }, { socket, user });
    });

    routeEvent(socket, 'geogebra:add', 'add', handleAdd);
    routeEvent(socket, 'geogebra:update', 'update', handleUpdate);
    routeEvent(socket, 'geogebra:remove', 'remove', handleRemove);
    routeEvent(socket, 'geogebra:clear', 'clear', handleClear);
    routeEvent(socket, 'geogebra:rename', 'rename', handleRename);
    routeEvent(socket, 'geogebra:grant', 'grant', handleGrant);

    socket.on('disconnect', () => {
      const roomId = socketRoom.get(socket.id);
      socketRoom.delete(socket.id);
      socketSessionApps.delete(socket.id);
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
