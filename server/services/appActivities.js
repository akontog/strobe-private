const fs = require('fs');
const path = require('path');

const BASE_ACTIVITIES_DIR = path.join(__dirname, '..', 'data', 'activities');

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

function resourceSlug(appSlug) {
  return sanitizeSlug(appSlug);
}

function activityPath(filename) {
  return path.join(BASE_ACTIVITIES_DIR, filename);
}

function saveActivity(appSlug, data, author) {
  ensureBaseDir();
  const safeSlug = resourceSlug(appSlug);
  const safeName = sanitizeName(data && data.name);
  const filename = `${Date.now()}_${safeSlug}_${safeName}.json`;

  const activityRecord = {
    resource: safeSlug,
    name: data && data.name ? String(data.name) : 'Untitled activity',
    subtitle: data && typeof data.subtitle === 'string' ? data.subtitle : '',
    config: data && data.config ? data.config : {},
    notes: data && typeof data.notes === 'string' ? data.notes : '',
    createdAt: new Date().toISOString(),
    author: author || null
  };

  fs.writeFileSync(
    activityPath(filename),
    JSON.stringify(activityRecord, null, 2),
    'utf8'
  );

  return {
    filename,
    ...activityRecord
  };
}

function listActivities(appSlug) {
  ensureBaseDir();
  const safeSlug = resourceSlug(appSlug);

  return fs
    .readdirSync(BASE_ACTIVITIES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const filePath = activityPath(file);

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (parsed.resource !== safeSlug) return null;
        return {
          filename: file,
          name: parsed.name || file,
          createdAt: parsed.createdAt || null,
          author: parsed.author || null
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function listAllActivities() {
  ensureBaseDir();
  return fs
    .readdirSync(BASE_ACTIVITIES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        const parsed = JSON.parse(fs.readFileSync(activityPath(file), 'utf8'));
        return {
          filename: file,
          resource: parsed.resource || '',
          name: parsed.name || file,
          createdAt: parsed.createdAt || null,
          author: parsed.author || null
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function getActivity(appSlug, filename) {
  ensureBaseDir();
  const safeSlug = resourceSlug(appSlug);
  const safeFilename = sanitizeFilename(filename);

  if (!safeFilename) {
    return null;
  }

  const filePath = activityPath(safeFilename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (parsed.resource !== safeSlug) return null;
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
  listAllActivities,
  getActivity
};
