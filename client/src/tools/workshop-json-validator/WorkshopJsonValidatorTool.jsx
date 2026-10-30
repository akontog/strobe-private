import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroTitle } from '../../shared/components';
import { isActivityResourceType } from '../../shared/components/activities/resourceRegistry';
import './WorkshopJsonValidatorTool.css';

const FORBIDDEN_KEY_SUFFIX = 'Key';
const VALID_DOCUMENT_TYPES = ['activity', 'sequence', 'workshop'];

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function collectForbiddenKeys(value, path = '$', results = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenKeys(entry, `${path}[${index}]`, results));
    return results;
  }

  const obj = safeObject(value);
  if (!obj) {
    return results;
  }

  Object.keys(obj).forEach((key) => {
    const nextPath = `${path}.${key}`;
    if (String(key).endsWith(FORBIDDEN_KEY_SUFFIX)) {
      results.push(nextPath);
    }
    collectForbiddenKeys(obj[key], nextPath, results);
  });
  return results;
}

function findDuplicateIds(entries, label) {
  const seen = new Set();
  const duplicates = new Set();

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const id = entry && typeof entry.id === 'string' ? entry.id.trim() : '';
    if (!id) {
      return;
    }
    const scoped = `${label}:${id}`;
    if (seen.has(scoped)) {
      duplicates.add(id);
      return;
    }
    seen.add(scoped);
  });

  return Array.from(duplicates);
}

function validateResources(resources, issues) {
  resources.forEach((resource, index) => {
    const resourcePath = `resources[${index}]`;
    if (!safeObject(resource)) {
      issues.push(`${resourcePath} must be an object.`);
      return;
    }
    if (typeof resource.id !== 'string' || !resource.id.trim()) {
      issues.push(`${resourcePath}.id is required.`);
    }
    if (typeof resource.type !== 'string' || !resource.type.trim()) {
      issues.push(`${resourcePath}.type is required.`);
    } else if (!isActivityResourceType(resource.type)) {
      issues.push(`${resourcePath}.type "${resource.type}" is not registered as a shared resource.`);
    }
    if (!safeObject(resource.config)) {
      issues.push(`${resourcePath}.config must be an object.`);
    } else if (!safeObject(resource.config.settings)) {
      issues.push(`${resourcePath}.config.settings must be an object.`);
    }
    if (resource.region != null && !['left', 'center', 'right', 'top', 'bottom'].includes(resource.region)) {
      issues.push(`${resourcePath}.region must be left, center, right, top, or bottom.`);
    }
  });
}

function validateAnswerGridResources(resources, issues) {
  resources.forEach((resource, resourceIndex) => {
    if (resource?.type !== 'activity-data') return;
    const items = resource.config?.data?.items;
    if (!Array.isArray(items)) return;

    items.forEach((item, itemIndex) => {
      const itemPath = `resources[${resourceIndex}].config.data.items[${itemIndex}]`;
      const layout = item.answerLayout;
      if (layout) {
        const columns = Number(layout.columns);
        if (!Number.isInteger(columns) || columns < 1) {
          issues.push(`${itemPath}.answerLayout.columns must be a positive integer.`);
        }
        if (!Array.isArray(layout.columnLabels) || layout.columnLabels.length !== columns) {
          issues.push(`${itemPath}.answerLayout.columnLabels must contain one label per column.`);
        }
      }

      (Array.isArray(item.answerGroups) ? item.answerGroups : []).forEach((group, groupIndex) => {
        (Array.isArray(group.fields) ? group.fields : []).forEach((field, fieldIndex) => {
          const fieldPath = `${itemPath}.answerGroups[${groupIndex}].fields[${fieldIndex}]`;
          const rows = Number(field.rows);
          const columns = Number(field.columns);
          const min = Number(field.min);
          const max = Number(field.max);
          const step = Number(field.step);
          const choiceCount = rows * columns;
          const rangeCount = step > 0 ? Math.round((max - min) / step) + 1 : 0;
          if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
            issues.push(`${fieldPath} must define positive integer rows and columns.`);
          }
          if (!Number.isFinite(min) || !Number.isFinite(max) || max < min || !Number.isFinite(step) || step <= 0) {
            issues.push(`${fieldPath} must define a valid min, max, and positive step.`);
          } else if (rangeCount !== choiceCount || Math.abs((max - min) / step - (rangeCount - 1)) > 1e-9) {
            issues.push(`${fieldPath} range must generate exactly rows × columns choices.`);
          }
          if (!Array.isArray(field.optionLabels) || field.optionLabels.length !== choiceCount) {
            issues.push(`${fieldPath}.optionLabels must contain one label per choice.`);
          }
          if (field.correctAnswer === undefined && !Array.isArray(field.correctAnswers)) {
            issues.push(`${fieldPath} must define correctAnswer or correctAnswers.`);
          }
        });
      });
    });
  });
}

function validateActivities(activities, issues) {
  activities.forEach((activity, index) => {
    const activityPath = `activities[${index}]`;
    if (!safeObject(activity)) {
      issues.push(`${activityPath} must be an object.`);
      return;
    }
    ['id', 'code', 'title', 'mode'].forEach((field) => {
      if (typeof activity[field] !== 'string' || !activity[field].trim()) {
        issues.push(`${activityPath}.${field} is required.`);
      }
    });
    if (activity.objective != null && typeof activity.objective !== 'string') {
      issues.push(`${activityPath}.objective must be a string when present.`);
    }
    const hasResourceReferences = Array.isArray(activity.usesResources) && activity.usesResources.length > 0;
    const hasStandaloneFile = typeof activity.activityFile === 'string' && activity.activityFile.trim();
    if (!hasResourceReferences && !hasStandaloneFile) {
      issues.push(`${activityPath} must include usesResources or an activityFile reference.`);
    }
  });
}

function validateActivityResourceRefs(activities, resourceIds, issues) {
  activities.forEach((activity) => {
    const list = Array.isArray(activity && activity.usesResources) ? activity.usesResources : [];
    list.forEach((resourceId) => {
      const normalized = String(resourceId || '').trim();
      if (!normalized) {
        return;
      }
      if (!resourceIds.has(normalized)) {
        issues.push(`Unknown resource reference "${normalized}" in activity "${String(activity && activity.id || '?')}".`);
      }
    });
  });
}

function validateWorkshopDocument(rawText) {
  const issues = [];
  let documentValue;
  try {
    documentValue = JSON.parse(String(rawText || ''));
  } catch (error) {
    return {
      ok: false,
      issues: [`Invalid JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`]
    };
  }

  const root = safeObject(documentValue);
  if (!root) {
    return { ok: false, issues: ['Root must be a JSON object.'] };
  }

  if (root.schemaVersion !== '1.0') {
    issues.push('schemaVersion must be "1.0".');
  }
  if (typeof root.language !== 'string' || root.language.trim().length < 2) {
    issues.push('language must be a language code such as "el" or "en".');
  }

  const documentType = String(root.documentType || 'workshop').trim();
  if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
    issues.push('documentType must be one of: activity, sequence, workshop.');
  }

  const resources = Array.isArray(root.resources) ? root.resources : null;
  if (!resources) {
    issues.push('resources must be an array.');
  } else {
    validateResources(resources, issues);
    validateAnswerGridResources(resources, issues);
    const duplicateResourceIds = findDuplicateIds(resources, 'resource');
    if (duplicateResourceIds.length) {
      issues.push(`Duplicate resource ids: ${duplicateResourceIds.join(', ')}`);
    }
  }

  const resourceIds = new Set((resources || []).map((entry) => String(entry && entry.id || '').trim()).filter(Boolean));

  if (documentType === 'activity') {
    const activity = safeObject(root.activity);
    if (!activity) {
      issues.push('activity must exist and be an object when documentType is "activity".');
    } else {
      ['id', 'code', 'title', 'mode'].forEach((field) => {
        if (typeof activity[field] !== 'string' || !activity[field].trim()) {
          issues.push(`activity.${field} is required.`);
        }
      });
      if (activity.objective != null && typeof activity.objective !== 'string') {
        issues.push('activity.objective must be a string when present.');
      }
      if (!Array.isArray(activity.usesResources)) {
        issues.push('activity.usesResources must be an array.');
      } else if (!activity.usesResources.length) {
        issues.push('activity.usesResources must contain at least one resource id.');
      }
      validateActivityResourceRefs([activity], resourceIds, issues);
    }
  } else if (documentType === 'sequence') {
    const sequence = safeObject(root.sequence);
    if (!sequence) {
      issues.push('sequence must exist and be an object when documentType is "sequence".');
    } else {
      if (typeof sequence.id !== 'string' || !sequence.id.trim()) {
        issues.push('sequence.id is required.');
      }
      if (typeof sequence.title !== 'string' || !sequence.title.trim()) {
        issues.push('sequence.title is required.');
      }
    }

    const activities = Array.isArray(root.activities) ? root.activities : null;
    if (!activities || !activities.length) {
      issues.push('activities must be a non-empty array when documentType is "sequence".');
    } else {
      validateActivities(activities, issues);
      const duplicateActivityIds = findDuplicateIds(activities, 'activity');
      if (duplicateActivityIds.length) {
        issues.push(`Duplicate activity ids: ${duplicateActivityIds.join(', ')}`);
      }
      validateActivityResourceRefs(activities, resourceIds, issues);
      const activityIds = new Set(activities.map((entry) => String(entry && entry.id || '').trim()).filter(Boolean));
      if (Array.isArray(sequence?.activityIds)) {
        sequence.activityIds.forEach((activityId) => {
          const normalized = String(activityId || '').trim();
          if (!normalized || !activityIds.has(normalized)) {
            issues.push(`sequence.activityIds contains unknown activity id "${normalized}".`);
          }
        });
      } else {
        issues.push('sequence.activityIds must be an array of activity ids.');
      }
    }

  } else {
    const workshop = safeObject(root.workshop);
    if (!workshop) {
      issues.push('workshop must exist and be an object when documentType is "workshop".');
    } else {
      if (typeof workshop.id !== 'string' || !workshop.id.trim()) {
        issues.push('workshop.id is required.');
      }
      if (typeof workshop.title !== 'string' || !workshop.title.trim()) {
        issues.push('workshop.title is required.');
      }
    }

    const activities = Array.isArray(root.activities) ? root.activities : [];
    const sequences = Array.isArray(root.sequences) ? root.sequences : [];
    if (!activities.length && !sequences.length) {
      issues.push('workshop document must include activities and/or sequences.');
    }

    if (activities.length) {
      validateActivities(activities, issues);
      const duplicateActivityIds = findDuplicateIds(activities, 'activity');
      if (duplicateActivityIds.length) {
        issues.push(`Duplicate activity ids: ${duplicateActivityIds.join(', ')}`);
      }
      validateActivityResourceRefs(activities, resourceIds, issues);
    }

    if (sequences.length) {
      const activityIds = new Set(activities.map((entry) => String(entry && entry.id || '').trim()).filter(Boolean));
      sequences.forEach((sequence, index) => {
        const sequencePath = `sequences[${index}]`;
        if (!safeObject(sequence)) {
          issues.push(`${sequencePath} must be an object.`);
          return;
        }
        if (typeof sequence.id !== 'string' || !sequence.id.trim()) {
          issues.push(`${sequencePath}.id is required.`);
        }
        if (typeof sequence.title !== 'string' || !sequence.title.trim()) {
          issues.push(`${sequencePath}.title is required.`);
        }
        if (!Array.isArray(sequence.activityIds) || !sequence.activityIds.length) {
          issues.push(`${sequencePath}.activityIds must be a non-empty array.`);
          return;
        }
        sequence.activityIds.forEach((activityId) => {
          const normalized = String(activityId || '').trim();
          if (!normalized || !activityIds.has(normalized)) {
            issues.push(`${sequencePath}.activityIds contains unknown activity id "${normalized}".`);
          }
        });
      });
      const duplicateSequenceIds = findDuplicateIds(sequences, 'sequence');
      if (duplicateSequenceIds.length) {
        issues.push(`Duplicate sequence ids: ${duplicateSequenceIds.join(', ')}`);
      }
    }
  }

  const forbiddenKeys = collectForbiddenKeys(root);
  if (forbiddenKeys.length) {
    issues.push(`Forbidden locale-style keys detected: ${forbiddenKeys.join(', ')}`);
  }

  return { ok: issues.length === 0, issues };
}

const SAMPLE_DOCUMENT = `{
  "schemaVersion": "1.0",
  "documentType": "workshop",
  "language": "el",
  "workshop": {
    "id": "linear-systems",
    "title": "Γραμμικά Συστήματα",
    "description": "Σύνδεση δραστηριοτήτων με κοινά resources"
  },
  "resources": [
    {
      "id": "answer-input",
      "type": "input-grid",
      "region": "center",
      "config": {
        "settings": {
          "props": {
            "fields": [{ "id": "x", "label": "Τιμή x" }]
          }
        }
      }
    },
    {
      "id": "graph-main",
      "type": "plot-widget",
      "region": "right",
      "config": {
        "settings": {
          "xMin": -10,
          "xMax": 10,
          "yMin": -10,
          "yMax": 10
        }
      }
    }
  ],
  "activities": [
    {
      "id": "a-1",
      "code": "1.",
      "title": "Γραφική δημιουργία συστήματος",
      "objective": "Συμπλήρωσε εξισώσεις και δες τις στο γράφημα.",
      "mode": "input-grid",
      "usesResources": ["answer-input", "graph-main"]
    }
  ],
  "sequences": [
    {
      "id": "seq-1",
      "title": "Βασική πορεία",
      "activityIds": ["a-1"]
    }
  ]
}`;

export default function WorkshopJsonValidatorTool() {
  const { t } = useTranslation('interface');
  const [jsonText, setJsonText] = useState(SAMPLE_DOCUMENT);
  const [result, setResult] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState('');
  const [fileLoadError, setFileLoadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const issuesCount = useMemo(() => {
    if (!result || !Array.isArray(result.issues)) {
      return 0;
    }
    return result.issues.length;
  }, [result]);

  function loadJsonFile(file) {
    if (!file) {
      return;
    }
    const filename = String(file.name || '').trim();
    const lowerName = filename.toLowerCase();
    if (!lowerName.endsWith('.json')) {
      setFileLoadError(t('workshopJsonValidator.invalidFileType'));
      setLoadedFileName('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextText = typeof reader.result === 'string' ? reader.result : '';
      setJsonText(nextText);
      setResult(null);
      setLoadedFileName(filename);
      setFileLoadError('');
    };
    reader.onerror = () => {
      setFileLoadError(t('workshopJsonValidator.fileLoadError'));
      setLoadedFileName('');
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleJsonFileLoad(event) {
    const file = event && event.target && event.target.files && event.target.files[0];
    loadJsonFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    loadJsonFile(file);
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle title={t('workshopJsonValidator.title')} />
        <p className="page-hero__lead">{t('workshopJsonValidator.lead')}</p>

        <section className="lab-card lab-card--panel workshop-json-validator">
          <div
            className={`workshop-json-validator__dropzone ${isDragOver ? 'is-dragover' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
          >
            <label className="workshop-json-validator__label" htmlFor="workshop-json-file-input">
              {t('workshopJsonValidator.fileInputLabel')}
            </label>
            <input
              id="workshop-json-file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleJsonFileLoad}
            />
            <p className="workshop-json-validator__dropzone-hint">
              {t('workshopJsonValidator.dropHint')}
            </p>
          </div>

          {loadedFileName ? (
            <p className="workshop-json-validator__file-status">
              {t('workshopJsonValidator.fileLoaded', { filename: loadedFileName })}
            </p>
          ) : null}
          {fileLoadError ? <p className="workshop-json-validator__file-error">{fileLoadError}</p> : null}

          <label className="workshop-json-validator__label" htmlFor="workshop-json-input">
            {t('workshopJsonValidator.inputLabel')}
          </label>
          <textarea
            id="workshop-json-input"
            className="workshop-json-validator__textarea"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            spellCheck={false}
          />

          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setResult(validateWorkshopDocument(jsonText))}
            >
              {t('workshopJsonValidator.validateButton')}
            </button>
          </div>

          {result ? (
            <div className={`workshop-json-validator__result ${result.ok ? 'is-valid' : 'is-invalid'}`}>
              <p className="workshop-json-validator__summary">
                {result.ok
                  ? t('workshopJsonValidator.validSummary')
                  : t('workshopJsonValidator.invalidSummary', { count: issuesCount })}
              </p>
              {!result.ok && result.issues.length ? (
                <ul className="workshop-json-validator__issues">
                  {result.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
