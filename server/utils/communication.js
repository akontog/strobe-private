function sanitizeCommString(value, maxLen = 200) {
  const raw = String(value || '');

  if (!raw) {
    return '';
  }

  if (raw.startsWith('data:image/')) {
    return '[image-data omitted]';
  }

  if (raw.length <= maxLen) {
    return raw;
  }

  return `${raw.slice(0, maxLen)}...`;
}

function sanitizeCommPayload(value, depth = 0) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (depth > 3) {
    return '[max-depth]';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeCommString(value, 220);
  }

  if (Array.isArray(value)) {
    const list = value.slice(0, 12).map((item) => sanitizeCommPayload(item, depth + 1));

    if (value.length > 12) {
      list.push(`[+${value.length - 12} more]`);
    }

    return list;
  }

  if (typeof value === 'object') {
    const result = {};

    Object.keys(value).slice(0, 14).forEach((key) => {
      if (/image|frame|blob|buffer/i.test(key)) {
        result[key] = '[binary omitted]';
        return;
      }

      result[sanitizeCommString(key, 40)] = sanitizeCommPayload(value[key], depth + 1);
    });

    if (Object.keys(value).length > 14) {
      result.__moreKeys = Object.keys(value).length - 14;
    }

    return result;
  }

  return sanitizeCommString(value, 220);
}

function createCommunicationLog({ limit = 1200, catalog = [] } = {}) {
  const communicationLog = [];
  let communicationSeq = 0;

  function recordCommunication(entry) {
    const payload = entry && typeof entry === 'object' ? entry : {};
    const message = {
      id: ++communicationSeq,
      ts: Date.now(),
      isoTime: new Date().toISOString(),
      app: sanitizeCommString(payload.app || 'system', 40),
      direction: payload.direction === 'out' ? 'out' : 'in',
      event: sanitizeCommString(payload.event || 'unknown', 90),
      from: sanitizeCommString(payload.from || '-', 80),
      to: sanitizeCommString(payload.to || '-', 80),
      note: sanitizeCommString(payload.note || '', 200),
      payload: sanitizeCommPayload(payload.payload)
    };

    communicationLog.push(message);

    if (communicationLog.length > limit) {
      communicationLog.splice(0, communicationLog.length - limit);
    }
  }

  function getCommunicationLog(options = {}) {
    const parsedLimit = Number.parseInt(options.limit, 10);
    const selectedLimit = Number.isInteger(parsedLimit)
      ? Math.max(20, Math.min(2000, parsedLimit))
      : 300;

    const source = sanitizeCommString(options.source || '', 40).toLowerCase();
    const eventQuery = sanitizeCommString(options.event || '', 90).toLowerCase();

    let list = communicationLog;

    if (source) {
      list = list.filter((item) => String(item.app || '').toLowerCase() === source);
    }

    if (eventQuery) {
      list = list.filter((item) => String(item.event || '').toLowerCase().includes(eventQuery));
    }

    return list.slice(-selectedLimit).reverse().map((item) => ({ ...item }));
  }

  function clearCommunicationLog() {
    const cleared = communicationLog.length;
    communicationLog.length = 0;
    communicationSeq = 0;
    return cleared;
  }

  function getCommunicationCatalog() {
    return catalog.map((item) => ({ ...item }));
  }

  return {
    recordCommunication,
    getCommunicationLog,
    clearCommunicationLog,
    getCommunicationCatalog,
    sanitizeCommString,
    sanitizeCommPayload
  };
}

module.exports = {
  createCommunicationLog,
  sanitizeCommString,
  sanitizeCommPayload
};
