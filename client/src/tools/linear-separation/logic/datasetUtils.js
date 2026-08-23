// 
export function inferFeatureKeys(dataset) {
  if (!dataset || !Array.isArray(dataset.examples) || dataset.examples.length === 0) {
    return [];
  }

  if (dataset.features && typeof dataset.features === 'object') {
    return Object.keys(dataset.features).filter((key) => Number.isFinite(Number(dataset.examples[0][key])));
  }

  const block = dataset.examples[0];
  return Object.keys(block).filter((key) => Number.isFinite(Number(block[key])));
}

export function formatRule(weights, featureKeys, theta) {
  const terms = weights
    .map((w, i) => `${w >= 0 && i > 0 ? '+ ' : ''}${w}·${featureKeys[i]}`)
    .join(' ');
  return `${terms} > ${theta.toFixed(3)}`;
}