// =============================================================
//  utils/cookies.js
//
//  Μικρός cookie parser, χωρίς εξωτερικό dependency (όπως cookie-parser).
//  Δουλεύει τόσο σε Express req (HTTP) όσο και σε raw upgrade request
//  (WebSocket handshake) — και τα δύο έχουν headers.cookie ως ένα
//  string της μορφής "a=1; b=2".
// =============================================================

// "a=1; b=2%20c" -> { a: '1', b: '2 c' }
function parseCookieHeader(header) {
  const jar = {};
  String(header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) {
      return;
    }

    const key = part.slice(0, idx).trim();
    const rawValue = part.slice(idx + 1).trim();
    if (!key) {
      return;
    }

    try {
      jar[key] = decodeURIComponent(rawValue);
    } catch {
      jar[key] = rawValue;
    }
  });

  return jar;
}

// Διαβάζει ένα συγκεκριμένο cookie από headers (Express ή raw request και τα δύο)
function getCookie(headers, name) {
  const header = headers && (headers.cookie || headers.Cookie);
  const jar = parseCookieHeader(header);
  return jar[name];
}

module.exports = { parseCookieHeader, getCookie };
