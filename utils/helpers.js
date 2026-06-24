const path = require('path');
// δέχεται τιμή και επιστρέφει μια "καθαρή" έκδοση της τιμής,
function sanitizeString(value, maxLen = 80) {
  return String(value || '')  // 1. Μετατροπή σε string
    .trim()                  // 2. Αφαίρεση κενών από άκρες
    .replace(/\s+/g, ' ')    // 3. Συμπίεση πολλαπλών κενών/αλλαγών γραμμής σε ένα κενό
    .slice(0, maxLen);       // 4. Περικοπή στα πρώτα maxLen (προεπιλογή 80) χαρακτήρες
}

// Παίρνει ένα string (το όνομα αρχείου) και επιστρέφει ένα καθαρισμένο string.
function sanitizeLegacyFilename(filename) {
  const basename = path.basename(String(filename || ''));
  const safe = basename.replace(/[^a-z0-9._-]/gi, '');

  return safe.endsWith('.json') ? safe : '';
}

// Δέχεται τιμή και επιστρέφει μια "καθαρή" έκδοση της τιμής,
function parseRealtimeMessage(raw) {
  try {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
    const parsed = JSON.parse(text);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const event = typeof parsed.event === 'string' ? parsed.event.trim() : '';
    if (!event) {
      return null;
    }

    return {
      event,
      data: parsed.data
    };
  } catch {
    return null;
  }
}

module.exports = {
  sanitizeString,
  sanitizeLegacyFilename,
  parseRealtimeMessage
};