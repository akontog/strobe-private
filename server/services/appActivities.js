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

function getDocumentActivity(document) {
  if (document && document.documentType === 'activity') return document.activity || {};
  return document || {};
}

function getStoredResource(document, filename) {
  if (document && document.resource) return resourceSlug(document.resource);
  const parts = String(filename || '').split('_');
  return parts.length > 2 ? resourceSlug(parts[1]) : '';
}

function createLegacyActivityDocument(appSlug, data) {
  const config = data && data.config && typeof data.config === 'object' ? data.config : {};
  const baseType = resourceSlug(config.resource || appSlug).replace(/-collab$/, '');
  const resourceType = baseType === 'venn' ? 'venn-board' : baseType === 'vision' ? 'vision-board' : baseType;
  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const mainConfig = { ...config };
  delete mainConfig.resource;
  delete mainConfig.widgets;
  const resources = [{
    id: 'main-resource',
    type: resourceType,
    region: 'center',
    config: { settings: mainConfig }
  }, ...widgets.map((widget, index) => ({
    id: String(widget.id || `widget-${index + 1}`),
    type: String(widget.type || 'unknown'),
    region: widget.position,
    config: { settings: widget.settings || {} }
  }))];

  return {
    schemaVersion: '1.0',
    documentType: 'activity',
    language: 'el',
    resources,
    activity: {
      id: `${resourceType}-activity`,
      code: '1.',
      title: String(data && data.name || 'Untitled activity'),
      objective: String(data && data.subtitle || ''),
      notes: String(data && data.notes || ''),
      mode: resourceType,
      usesResources: resources.map((resource) => resource.id)
    }
  };
}

function saveActivity(appSlug, data, author) {
  ensureBaseDir();
  const safeSlug = resourceSlug(appSlug);
  const suppliedDocument = data && data.document;
  const document = suppliedDocument || createLegacyActivityDocument(safeSlug, data);
  const activity = getDocumentActivity(document);
  const safeName = sanitizeName(activity.title || (data && data.name));
  const filename = `${Date.now()}_${safeSlug}_${safeName}.json`;
  const createdAt = new Date().toISOString();
  const activityRecord = {
    ...document,
    metadata: {
      ...(document.metadata || {}),
      createdAt,
      author: author || null
    }
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
        if (getStoredResource(parsed, file) !== safeSlug) return null;
        const activity = getDocumentActivity(parsed);
        return {
          filename: file,
          resource: safeSlug,
          name: activity.title || parsed.name || file,
          createdAt: parsed.metadata?.createdAt || parsed.createdAt || null,
          author: parsed.metadata?.author || parsed.author || null
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
        const activity = getDocumentActivity(parsed);
        return {
          filename: file,
          resource: getStoredResource(parsed, file),
          name: activity.title || parsed.name || file,
          createdAt: parsed.metadata?.createdAt || parsed.createdAt || null,
          author: parsed.metadata?.author || parsed.author || null
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
    if (getStoredResource(parsed, safeFilename) !== safeSlug) return null;
    return {
      filename: safeFilename,
      resource: safeSlug,
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
