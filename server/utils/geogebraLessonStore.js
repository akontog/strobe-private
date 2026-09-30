const fs = require('node:fs');
const path = require('node:path');

function normalizeLesson(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const id = String(raw.id || '').trim();
  const roomId = String(raw.roomId || raw.id || '').trim();
  if (!id || !roomId) {
    return null;
  }

  const createdBy = String(raw.createdBy || 'system').trim() || 'system';
  const state = raw.state && typeof raw.state === 'object' ? raw.state : {};
  const perms = raw.perms && typeof raw.perms === 'object' ? raw.perms : {};

  return {
    id,
    roomId,
    createdBy,
    state,
    perms
  };
}

function createGeogebraLessonStore({ filePath } = {}) {
  const resolvedPath = filePath
    ? path.resolve(filePath)
    : path.resolve(__dirname, '..', 'data', 'geogebraLessons.json');

  let lessonsByRoom = new Map();

  function load() {
    let parsed = [];

    try {
      const raw = fs.readFileSync(resolvedPath, 'utf8');
      const data = JSON.parse(raw);
      parsed = Array.isArray(data) ? data : [];
    } catch {
      parsed = [];
    }

    const next = new Map();
    parsed.forEach((entry) => {
      const lesson = normalizeLesson(entry);
      if (!lesson) {
        return;
      }
      next.set(lesson.roomId, lesson);
    });

    lessonsByRoom = next;
  }

  load();

  function getByRoomId(roomId) {
    load();

    const key = String(roomId || '').trim();
    if (!key) {
      return null;
    }

    const lesson = lessonsByRoom.get(key);
    if (!lesson) {
      return null;
    }

    return JSON.parse(JSON.stringify(lesson));
  }

  return {
    getByRoomId,
    reload: load
  };
}

module.exports = {
  createGeogebraLessonStore
};
