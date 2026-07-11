function getHeaderValue(headers, key) {
  if (!headers || !key) {
    return '';
  }

  const loweredKey = String(key).toLowerCase();
  const direct = headers[loweredKey];

  if (Array.isArray(direct)) {
    return String(direct[0] || '');
  }

  if (typeof direct === 'string') {
    return direct;
  }

  const fallbackKey = Object.keys(headers).find((headerKey) => String(headerKey).toLowerCase() === loweredKey);

  if (!fallbackKey) {
    return '';
  }

  const fallbackValue = headers[fallbackKey];

  if (Array.isArray(fallbackValue)) {
    return String(fallbackValue[0] || '');
  }

  return typeof fallbackValue === 'string' ? fallbackValue : '';
}

function extractIpFromHeaders(headers, fallback = 'unknown') {
  const forwarded = getHeaderValue(headers, 'x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim() || fallback;
  }

  return fallback;
}

function toIsoTimestamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return new Date(numeric).toISOString();
}

function getSocketClientInfo(socket) {
  const handshake = socket && socket.handshake ? socket.handshake : {};
  const headers = handshake.headers || {};
  const fallbackIp = handshake.address || (socket && socket.conn ? socket.conn.remoteAddress : '') || 'unknown';

  return {
    ip: extractIpFromHeaders(headers, fallbackIp),
    userAgent: getHeaderValue(headers, 'user-agent') || 'unknown'
  };
}

function getUpgradeClientInfo(request) {
  const headers = request && request.headers ? request.headers : {};
  const fallbackIp = request && request.socket ? request.socket.remoteAddress : 'unknown';

  return {
    ip: extractIpFromHeaders(headers, fallbackIp),
    userAgent: getHeaderValue(headers, 'user-agent') || 'unknown'
  };
}

module.exports = {
  getHeaderValue,
  extractIpFromHeaders,
  toIsoTimestamp,
  getSocketClientInfo,
  getUpgradeClientInfo
};
