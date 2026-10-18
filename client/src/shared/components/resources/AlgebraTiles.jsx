import React, { useState } from 'react';
import './AlgebraTiles.css';
import { useSessionInputLogger } from '../activities/SessionLogContext';

const TILE_TYPES = [
  { id: 'one', label: '1', name: 'Μονάδα', className: 'unit' },
  { id: 'x', label: 'x', name: 'x', className: 'x' },
  { id: 'y', label: 'y', name: 'y', className: 'y' },
  { id: 'x2', label: 'x²', name: 'x²', className: 'x2' },
  { id: 'xy', label: 'xy', name: 'xy', className: 'xy' },
  { id: 'y2', label: 'y²', name: 'y²', className: 'y2' }
];

const TILE_SPANS = {
  one: [2, 2],
  x: [6, 2],
  y: [4, 2],
  x2: [6, 6],
  xy: [6, 4],
  y2: [4, 4]
};
const GRID_UNIT = 20;
const T_CHART_AXIS = 160;

function getTileDimensions(type, orientation) {
  const [spanX, spanY] = getTileSpans(type, orientation);
  return { width: spanX * GRID_UNIT, height: spanY * GRID_UNIT };
}

function formatPolynomial(tiles) {
  const powers = { x2: 0, xy: 0, y2: 0, x: 0, y: 0, one: 0 };
  tiles.forEach((tile) => {
    if (Object.hasOwn(powers, tile.type)) powers[tile.type] += tile.sign < 0 ? -1 : 1;
  });

  const terms = [
    ['x2', 'x²'], ['xy', 'xy'], ['y2', 'y²'], ['x', 'x'], ['y', 'y'], ['one', '']
  ].filter(([type]) => powers[type] !== 0);
  if (!terms.length) return '0';

  return terms.map(([type, monomial], index) => {
    const coefficient = powers[type];
    const absoluteCoefficient = Math.abs(coefficient);
    const body = `${monomial && absoluteCoefficient === 1 ? '' : absoluteCoefficient}${monomial}` || '1';
    if (index === 0) return coefficient < 0 ? `-${body}` : body;
    return `${coefficient < 0 ? ' - ' : ' + '}${body}`;
  }).join('');
}

function getTileSpans(type, orientation) {
  const [width, height] = TILE_SPANS[type] || [1, 1];
  if ((type === 'x' || type === 'y') && orientation === 'vertical') {
    return [height, width];
  }
  return [width, height];
}

export default function AlgebraTiles({ activity = '', tiles: sharedTiles, onTilesChange, layout = 'free' }) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const [localTiles, setLocalTiles] = useState([]);
  const tiles = Array.isArray(sharedTiles) ? sharedTiles : localTiles;
  const tChartTiles = layout === 't-chart'
    ? tiles.reduce((groups, tile) => {
      const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
      const { width, height } = getTileDimensions(tile.type, orientation);
      const centerX = (tile.x || 0) * GRID_UNIT + width / 2;
      const centerY = (tile.y || 0) * GRID_UNIT + height / 2;
      if (centerY < T_CHART_AXIS && centerX >= T_CHART_AXIS) groups.horizontal.push(tile);
      else if (centerY >= T_CHART_AXIS && centerX < T_CHART_AXIS) groups.vertical.push(tile);
      else if (centerY >= T_CHART_AXIS && centerX >= T_CHART_AXIS) groups.product.push(tile);
      return groups;
    }, { horizontal: [], vertical: [], product: [] })
    : null;
  const horizontalBounds = tChartTiles?.horizontal.reduce((bounds, tile) => {
    const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
    const { width, height } = getTileDimensions(tile.type, orientation);
    const left = (tile.x || 0) * GRID_UNIT;
    const top = (tile.y || 0) * GRID_UNIT;
    return {
      left: Math.min(bounds.left, left),
      right: Math.max(bounds.right, left + width),
      top: Math.min(bounds.top, top),
      bottom: Math.max(bounds.bottom, top + height)
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  const verticalBounds = tChartTiles?.vertical.reduce((bounds, tile) => {
    const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
    const { width, height } = getTileDimensions(tile.type, orientation);
    const left = (tile.x || 0) * GRID_UNIT;
    const top = (tile.y || 0) * GRID_UNIT;
    return {
      left: Math.min(bounds.left, left),
      right: Math.max(bounds.right, left + width),
      top: Math.min(bounds.top, top),
      bottom: Math.max(bounds.bottom, top + height)
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

  const commitTiles = (nextTiles) => {
    if (!canEdit) return;
    setLocalTiles(nextTiles);
    onTilesChange?.(nextTiles);
    sessionLogging?.logEvent('activity.tiles.changed', activity, {
      tiles: nextTiles.map(({ id, type, sign, orientation, x, y }) => ({ id, type, sign, orientation, x, y }))
    });
  };

  const beginTileDrag = (event, tile) => {
    event.dataTransfer.effectAllowed = tile.id ? 'move' : 'copy';
    const serialized = JSON.stringify({
      id: tile.id || '',
      type: tile.type,
      sign: tile.sign,
      orientation: tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal'),
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY
    });
    event.dataTransfer.setData('application/x-algebra-tile', serialized);
    event.dataTransfer.setData('text/plain', serialized);
  };

  const renderChoices = (type, key, orientation) => {
    const definition = TILE_TYPES.find((item) => item.id === type);
    return (
      <div className={`algebra-tiles__choice-cell algebra-tiles__choice-cell--${type}`} key={key}>
        {[1, -1].map((sign) => (
          <div key={sign}
            className={`algebra-tile algebra-tile--source algebra-tile--${definition.className} is-${orientation} ${sign < 0 ? 'is-negative' : ''}`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            aria-label={`${orientation === 'vertical' ? 'Κατακόρυφο' : 'Οριζόντιο'} ${sign < 0 ? 'αρνητικό' : 'θετικό'} πλακίδιο ${definition.name}`}
            aria-disabled={!canEdit}
            draggable={canEdit}
            onDragStart={(event) => beginTileDrag(event, { type, sign, orientation })}>
            {definition.label}
          </div>
        ))}
      </div>
    );
  };

  const dropTile = (event) => {
    if (!canEdit) return;
    event.preventDefault();

    try {
      const serialized = event.dataTransfer.getData('application/x-algebra-tile')
        || event.dataTransfer.getData('text/plain');
      const dragged = JSON.parse(serialized);
      const board = event.currentTarget;
      const bounds = board.getBoundingClientRect();
      const [spanX, spanY] = getTileSpans(dragged.type, dragged.orientation);
      const tileWidth = spanX * GRID_UNIT;
      const tileHeight = spanY * GRID_UNIT;
      const maxX = Math.max(0, Math.floor((board.clientWidth - tileWidth) / GRID_UNIT));
      const maxY = Math.max(0, Math.floor((board.clientHeight - tileHeight) / GRID_UNIT));
      const rawX = event.clientX - bounds.left + board.scrollLeft - dragged.offsetX;
      const rawY = event.clientY - bounds.top + board.scrollTop - dragged.offsetY;
      const x = Math.max(0, Math.min(maxX, Math.round(rawX / GRID_UNIT)));
      const y = Math.max(0, Math.min(maxY, Math.round(rawY / GRID_UNIT)));
      const id = dragged.id || `${Date.now()}-${Math.random()}`;
      const nextTiles = tiles
        .filter((tile) => tile.id !== id)
        .concat({ id, type: dragged.type, sign: dragged.sign, orientation: dragged.orientation, x, y });

      commitTiles(nextTiles);
    } catch {
      // Ignore drops that did not originate from an algebra tile.
    }
  };

  const removeTile = (id) => commitTiles(tiles.filter((tile) => tile.id !== id));
  return (
    <div className="algebra-tiles">
      <section className="algebra-tiles__board" aria-label="Πίνακας πλακιδίων">
        <div className={`algebra-tiles__placed${layout === 't-chart' ? ' is-t-chart' : ''}`}
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={dropTile}>
          {tChartTiles?.horizontal.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--horizontal" style={{
              left: `${(horizontalBounds.left + horizontalBounds.right) / 2}px`,
              top: `${Math.max(0, horizontalBounds.top - 34)}px`
            }}>
              ({formatPolynomial(tChartTiles.horizontal)})
            </output>
          ) : null}
          {tChartTiles?.vertical.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--vertical" style={{
              left: `${Math.max(0, verticalBounds.left - 136)}px`,
              top: `${(verticalBounds.top + verticalBounds.bottom) / 2}px`
            }}>
              ({formatPolynomial(tChartTiles.vertical)})
            </output>
          ) : null}
          {tChartTiles ? (
            <output className="algebra-tiles__product" aria-live="polite">
              {formatPolynomial(tChartTiles.product)}
            </output>
          ) : null}
          {tiles.map((tile) => {
            const definition = TILE_TYPES.find((item) => item.id === tile.type);
            if (!definition) return null;
            const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
            const [spanX, spanY] = getTileSpans(tile.type, orientation);
            return (
              <button key={tile.id} type="button" draggable={canEdit} disabled={!canEdit}
                onDragStart={(event) => beginTileDrag(event, tile)}
                onClick={() => removeTile(tile.id)}
                style={{
                  left: `${(tile.x || 0) * GRID_UNIT}px`,
                  top: `${(tile.y || 0) * GRID_UNIT}px`,
                  ...(orientation === 'vertical' && (tile.type === 'x' || tile.type === 'y')
                    ? { boxSizing: 'border-box', width: `${spanX * GRID_UNIT}px`, height: `${spanY * GRID_UNIT}px` }
                    : {})
                }}
                className={`algebra-tile algebra-tile--${definition.className} is-${orientation} ${tile.sign < 0 ? 'is-negative' : ''}`}
                aria-label={`${tile.sign < 0 ? 'Αρνητικό' : 'Θετικό'} πλακίδιο ${definition.name}`}
                title="Σύρε το πλακίδιο για μεταφορά ή πάτησε για αφαίρεση">
                {definition.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="algebra-tiles__palette" aria-label="Επιλογή πλακιδίων">
        {renderChoices('one', 'unit')}
        {renderChoices('x', 'x-horizontal', 'horizontal')}
        {renderChoices('y', 'y-horizontal', 'horizontal')}
        {renderChoices('x', 'x-vertical', 'vertical')}
        {renderChoices('x2', 'x2')}
        {renderChoices('xy', 'xy-top')}
        {renderChoices('y', 'y-vertical', 'vertical')}
        {renderChoices('xy', 'xy-bottom')}
        {renderChoices('y2', 'y2')}
      </section>
    </div>
  );
}
