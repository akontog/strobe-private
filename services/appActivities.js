const fs = require('fs');
const path = require('path');

const BASE_ACTIVITIES_DIR = path.join(__dirname, '..', 'activities');

function ensureBaseDir() {
  if (!fs.existsSync(BASE_ACTIVITIES_DIR)) {
    fs.mkdirSync(BASE_ACTIVITIES_DIR, { recursive: true });
  }
}

function sanitizeSlug(slug) {
  return String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function sanitizeName(name) {
  const cleaned = String(name || '')
    .trim()
    .replace(/[^a-z0-9-_ ]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 64);

  return cleaned || 'activity';
}

function sanitizeFilename(filename) {
  const basename = path.basename(String(filename || ''));
  const cleaned = basename.replace(/[^a-z0-9._-]/gi, '');

  return cleaned.endsWith('.json') ? cleaned : '';
}

function appDir(appSlug) {
  ensureBaseDir();

  const safeSlug = sanitizeSlug(appSlug);
  const dir = path.join(BASE_ACTIVITIES_DIR, safeSlug);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function saveActivity(appSlug, data, author) {
  const dir = appDir(appSlug);
  const safeName = sanitizeName(data && data.name);
  const filename = `${Date.now()}_${safeName}.json`;

  const activityRecord = {
    name: data && data.name ? String(data.name) : 'Untitled activity',
    config: data && data.config ? data.config : {},
    notes: data && typeof data.notes === 'string' ? data.notes : '',
    createdAt: new Date().toISOString(),
    author: author || null
  };

  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(activityRecord, null, 2),
    'utf8'
  );

  return {
    filename,
    ...activityRecord
  };
}

function listActivities(appSlug) {
  const dir = appDir(appSlug);

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const filePath = path.join(dir, file);

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          filename: file,
          name: parsed.name || file,
          createdAt: parsed.createdAt || null,
          author: parsed.author || null
        };
      } catch (error) {
        return {
          filename: file,
          name: file,
          createdAt: null,
          author: null
        };
      }
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function getActivity(appSlug, filename) {
  const safeFilename = sanitizeFilename(filename);

  if (!safeFilename) {
    return null;
  }

  const filePath = path.join(appDir(appSlug), safeFilename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      filename: safeFilename,
      ...parsed
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  saveActivity,
  listActivities,
  getActivity
};
