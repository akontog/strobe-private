import React, { useMemo, useState } from 'react';
import { findIntegerSeparator, dot } from './logic/linearSeparator';
import { inferFeatureKeys, formatRule } from './logic/datasetUtils';
import { Accordion } from '../../shared/components';
import { InputPanel, SettingsPanel, ResultsPanel } from './components';

import { DEFAULT_JSON } from './data/defaultDataset';
import './LinearSeparation.css';


export default function LinearSeparation() {
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
      <Accordion title="Εισαγωγή Dataset JSON">
        <InputPanel
          jsonText={jsonText}
          onJsonTextChange={setJsonText}
          onFileUpload={onFileUpload}
          onApply={applyJson}
          parseError={parseError}
        />
      </Accordion>
      
      <Accordion title="Ρυθμίσεις">
        <SettingsPanel
          datasetKeys={datasetKeys}
          datasetKey={datasetKey}
          onDatasetChange={onDatasetChange}
          examples={examples}
          effectiveTarget={effectiveTarget}
          onTargetChange={setTargetName}
        />
      </Accordion>

    <article className="tool-card">
        <h2>Αποτέλεσμα</h2>
        <ResultsPanel result={result} />
      </article>

    </section>
  );
}