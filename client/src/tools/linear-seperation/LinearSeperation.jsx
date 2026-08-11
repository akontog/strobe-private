import React, { useMemo, useState } from 'react';
import './LinearSeperation.css';

const DEFAULT_JSON = `{
  "vehicles": {
    "label": "Μέσα μεταφοράς",
    "features": {
      "i1": { "label": "Ρόδες" },
      "i2": { "label": "Μηχανές" }
    },
    "examples": [
      { "name": "Ποδήλατο", "i1": 2, "i2": 0 },
      { "name": "Μηχανάκι", "i1": 2, "i2": 1 },
      { "name": "Αυτοκίνητο", "i1": 4, "i2": 1 },
      { "name": "Πατίνι", "i1": 4, "i2": 0 }
    ],
    "linear_demos": [
      { "example": "Πατίνι" }
    ]
  }
}`;

function inferFeatureKeys(dataset) {
  if (!dataset || !Array.isArray(dataset.examples) || dataset.examples.length === 0) {
    return [];
  }

  if (dataset.features && typeof dataset.features === 'object') {
    return Object.keys(dataset.features).filter((key) => Number.isFinite(Number(dataset.examples[0][key])));
  }

  const block = dataset.examples[0];
  return Object.keys(block).filter((key) => Number.isFinite(Number(block[key])));
}

function cartesianIntegerVectors(dim, radius) {
  const out = [];
  const current = new Array(dim).fill(0);

  const dfs = (i) => {
    if (i === dim) {
      const maxAbs = Math.max(...current.map((x) => Math.abs(x)));
      if (maxAbs === radius) {
        out.push([...current]);
      }
      return;
    }

    for (let value = -radius; value <= radius; value += 1) {
      current[i] = value;
      dfs(i + 1);
    }
  };

  dfs(0);
  return out;
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function findIntegerSeparator(positive, negative, maxRadius = 12) {
  if (positive.length === 0 || negative.length === 0) {
    return { separable: false, reason: 'Χρειάζεται τουλάχιστον ένα θετικό και ένα αρνητικό δείγμα.' };
  }

  const dim = positive[0].x.length;
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    const vectors = cartesianIntegerVectors(dim, radius);

    for (const w of vectors) {
      const posVals = positive.map((p) => dot(w, p.x));
      const negVals = negative.map((n) => dot(w, n.x));
      const minPos = Math.min(...posVals);
      const maxNeg = Math.max(...negVals);

      if (minPos > maxNeg) {
        return {
          separable: true,
          w,
          theta: (minPos + maxNeg) / 2,
          radius,
          margin: minPos - maxNeg
        };
      }
    }
  }

  return {
    separable: false,
    reason: `Δεν βρέθηκε ακέραιος διαχωριστής για |w_j| <= ${maxRadius}.`
  };
}

function formatRule(weights, featureKeys, theta) {
  const terms = weights
    .map((w, i) => `${w >= 0 && i > 0 ? '+ ' : ''}${w}·${featureKeys[i]}`)
    .join(' ');
  return `${terms} > ${theta.toFixed(3)}`;
}

export default function LinearSeperation() {
  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [parsed, setParsed] = useState(() => {
    try {
      return JSON.parse(DEFAULT_JSON);
    } catch {
      return null;
    }
  });
  const [parseError, setParseError] = useState('');
  const datasetKeys = useMemo(() => (parsed ? Object.keys(parsed) : []), [parsed]);
  const [datasetKey, setDatasetKey] = useState('');
  const [targetName, setTargetName] = useState('');

  const activeDataset = datasetKey && parsed ? parsed[datasetKey] : null;
  const featureKeys = useMemo(() => inferFeatureKeys(activeDataset), [activeDataset]);
  const examples = activeDataset?.examples || [];

  const defaultTargetFromDemo = useMemo(() => {
    const demo = activeDataset?.linear_demos?.[0];
    return demo?.example || '';
  }, [activeDataset]);

  const effectiveTarget = targetName || defaultTargetFromDemo || examples[0]?.name || '';

  const result = useMemo(() => {
    if (!activeDataset || featureKeys.length === 0 || examples.length === 0 || !effectiveTarget) {
      return null;
    }

    const rows = examples.map((ex) => ({
      name: ex.name,
      x: featureKeys.map((key) => Number(ex[key]))
    }));

    const positive = rows.filter((r) => r.name === effectiveTarget);
    const negative = rows.filter((r) => r.name !== effectiveTarget);
    const sep = findIntegerSeparator(positive, negative);

    if (!sep.separable) {
      return { ...sep, rows: [], featureKeys, target: effectiveTarget };
    }

    const classified = rows.map((row) => {
      const value = dot(sep.w, row.x);
      const predictedPositive = value > sep.theta;
      const actualPositive = row.name === effectiveTarget;
      return {
        ...row,
        value,
        predictedPositive,
        actualPositive,
        correct: predictedPositive === actualPositive
      };
    });

    return {
      ...sep,
      rows: classified,
      featureKeys,
      target: effectiveTarget
    };
  }, [activeDataset, examples, featureKeys, effectiveTarget]);

  const applyJson = () => {
    try {
      const obj = JSON.parse(jsonText);
      setParsed(obj);
      setParseError('');

      const keys = Object.keys(obj);
      const first = keys[0] || '';
      setDatasetKey(first);

      if (first && obj[first]?.examples?.length) {
        const demoTarget = obj[first]?.linear_demos?.[0]?.example;
        setTargetName(demoTarget || obj[first].examples[0].name || '');
      } else {
        setTargetName('');
      }
    } catch (error) {
      setParseError(String(error.message || error));
    }
  };

  const onFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setJsonText(text);
  };

  const onDatasetChange = (nextKey) => {
    setDatasetKey(nextKey);
    const ds = parsed?.[nextKey];
    const demoTarget = ds?.linear_demos?.[0]?.example;
    setTargetName(demoTarget || ds?.examples?.[0]?.name || '');
  };

  return (
    <section className="tool-page linear-tool-page">
      <header className="tool-page-header">
        <h1>Linear Separation Tool</h1>
        <p>Δώσε JSON τύπου datasets.js και βρες υπερεπίπεδο για target-vs-rest.</p>
      </header>

      <article className="tool-card">
        <h2>Εισαγωγή Dataset JSON</h2>
        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          placeholder="Κάνε επικόλληση το JSON εδώ"
          rows={14}
        />
        <div className="tool-actions">
          <input type="file" accept="application/json,.json" onChange={onFileUpload} />
          <button type="button" onClick={applyJson}>Φόρτωση JSON</button>
        </div>
        {parseError ? <p className="tool-error">Σφάλμα JSON: {parseError}</p> : null}
      </article>

      <article className="tool-card">
        <h2>Ρυθμίσεις</h2>
        <div className="tool-grid tool-grid--two">
          <label>
            Dataset
            <select value={datasetKey} onChange={(event) => onDatasetChange(event.target.value)}>
              {datasetKeys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
          <label>
            Κατηγορία-στόχος
            <select value={effectiveTarget} onChange={(event) => setTargetName(event.target.value)}>
              {examples.map((example) => (
                <option key={example.name} value={example.name}>{example.name}</option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <article className="tool-card">
        <h2>Αποτέλεσμα</h2>
        {!result ? <p>Δεν υπάρχουν αρκετά στοιχεία ακόμα.</p> : null}

        {result && !result.separable ? (
          <div>
            <p className="tool-error">Δεν βρέθηκε διαχωριστής.</p>
            <p>{result.reason}</p>
          </div>
        ) : null}

        {result && result.separable ? (
          <>
            <p><strong>Βρέθηκε διαχωριστής.</strong> Μικρότερο max|w|: {result.radius}, margin: {result.margin.toFixed(3)}</p>
            <code className="linear-rule">{formatRule(result.w, result.featureKeys, result.theta)}</code>

            <table className="linear-table">
              <thead>
                <tr>
                  <th>Στοιχείο</th>
                  {result.featureKeys.map((key) => <th key={key}>{key}</th>)}
                  <th>w·x</th>
                  <th>Πρόβλεψη</th>
                  <th>Label</th>
                  <th>OK</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    {row.x.map((value, idx) => <td key={`${row.name}-${idx}`}>{value}</td>)}
                    <td>{row.value.toFixed(3)}</td>
                    <td>{row.predictedPositive ? 'θετικό' : 'αρνητικό'}</td>
                    <td>{row.actualPositive ? 'στόχος' : 'λοιπά'}</td>
                    <td className={row.correct ? 'linear-ok' : 'linear-bad'}>{row.correct ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </article>
    </section>
  );
}