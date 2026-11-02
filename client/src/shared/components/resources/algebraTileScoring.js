const TILE_TYPES = ['one', 'x', 'y', 'x2', 'xy', 'y2'];
const TILE_SPANS = {
  one: [2, 2],
  x: [6, 2],
  y: [4, 2],
  x2: [6, 6],
  xy: [6, 4],
  y2: [4, 4]
};

function getTileVector(tiles = []) {
  return tiles.reduce((vector, tile) => {
    if (TILE_TYPES.includes(tile?.type)) {
      vector[tile.type] += tile.sign < 0 ? -1 : 1;
    }
    return vector;
  }, Object.fromEntries(TILE_TYPES.map((type) => [type, 0])));
}

function getVectorKey(vector = {}) {
  return TILE_TYPES.map((type) => Number(vector?.[type] || 0)).join(',');
}

function getAreaRegion(tile) {
  const [baseWidth, baseHeight] = TILE_SPANS[tile.type] || [1, 1];
  const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
  const isVertical = orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type);
  const width = isVertical ? baseHeight : baseWidth;
  const height = isVertical ? baseWidth : baseHeight;
  const centerX = (Number(tile.x) || 0) + width / 2;
  const centerY = (Number(tile.y) || 0) + height / 2;

  if (centerY < 4 && centerX >= 6) return 'top';
  if (centerY >= 4 && centerX < 6) return 'left';
  if (centerY >= 4 && centerX >= 6) return 'center';
  return '';
}

function getActualRegions(tiles = [], mode = 'area') {
  const grouped = {};
  (Array.isArray(tiles) ? tiles : []).forEach((tile) => {
    let region = '';
    if (mode === 'area' || mode === 't-chart') {
      region = getAreaRegion(tile);
    } else if (mode === 'equation') {
      region = tile.side === 'right' ? 'right' : 'left';
    } else if (mode === 'systems') {
      const equationIndex = Number.isInteger(tile.equationIndex) ? tile.equationIndex : 0;
      const side = tile.side === 'right' ? 'right' : 'left';
      region = `equation-${equationIndex}-${side}`;
    }

    if (!region) return;
    if (!grouped[region]) grouped[region] = [];
    grouped[region].push(tile);
  });

  return Object.fromEntries(Object.entries(grouped).map(([region, regionTiles]) => [region, getTileVector(regionTiles)]));
}

function getExpectedAlternatives(expected) {
  return (Array.isArray(expected) ? expected : [expected])
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => getVectorKey(entry));
}

function getMaximumMatches(
  regionKeys,
  expectedRegions,
  actualRegions,
  index = 0,
  usedActual = new Set(),
  usedExpectedValues = new Set(),
  requireDistinctExpectedValues = false
) {
  if (index >= regionKeys.length) return 0;

  const expectedKey = regionKeys[index];
  const expectedValues = getExpectedAlternatives(expectedRegions[expectedKey]);
  let best = getMaximumMatches(
    regionKeys,
    expectedRegions,
    actualRegions,
    index + 1,
    usedActual,
    usedExpectedValues,
    requireDistinctExpectedValues
  );

  regionKeys.forEach((actualKey) => {
    if (usedActual.has(actualKey)) return;
    const actualValue = getVectorKey(actualRegions[actualKey] || {});
    if (!expectedValues.includes(actualValue)) return;
    if (requireDistinctExpectedValues && usedExpectedValues.has(actualValue)) return;

    const nextUsedActual = new Set(usedActual);
    nextUsedActual.add(actualKey);
    const nextUsedExpectedValues = new Set(usedExpectedValues);
    nextUsedExpectedValues.add(actualValue);
    best = Math.max(best, 1 + getMaximumMatches(
      regionKeys,
      expectedRegions,
      actualRegions,
      index + 1,
      nextUsedActual,
      nextUsedExpectedValues,
      requireDistinctExpectedValues
    ));
  });

  return best;
}

/** Scores each algebra-tile region against the expected tile values stored in the activity JSON. */
export function getAlgebraTileRegionScore(tiles, mode, tileScoring = {}) {
  const expectedRegions = tileScoring.regions && typeof tileScoring.regions === 'object'
    ? tileScoring.regions
    : {};
  const regionKeys = Object.keys(expectedRegions);
  const actualRegions = getActualRegions(tiles, mode);
  const unorderedGroups = (tileScoring.unorderedGroups || [])
    .filter((group) => Array.isArray(group) && group.every((key) => regionKeys.includes(key)));
  const distinctGroups = (tileScoring.distinctGroups || []).filter((group) => Array.isArray(group));
  const groupedKeys = new Set(unorderedGroups.flat());
  const pointsPerRegion = Number(tileScoring.pointsPerRegion) || 1;

  let correctRegions = 0;
  unorderedGroups.forEach((group) => {
    const requireDistinctExpectedValues = distinctGroups.some((distinctGroup) => (
      group.length === distinctGroup.length && group.every((key) => distinctGroup.includes(key))
    ));
    correctRegions += getMaximumMatches(group, expectedRegions, actualRegions, 0, new Set(), new Set(), requireDistinctExpectedValues);
  });
  regionKeys.filter((key) => !groupedKeys.has(key)).forEach((key) => {
    const expectedValues = getExpectedAlternatives(expectedRegions[key]);
    if (expectedValues.includes(getVectorKey(actualRegions[key] || {}))) {
      correctRegions += 1;
    }
  });

  return {
    score: correctRegions * pointsPerRegion,
    maxScore: regionKeys.length * pointsPerRegion,
    correctRegions,
    totalRegions: regionKeys.length
  };
}
