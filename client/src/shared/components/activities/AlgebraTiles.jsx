import React, { useState } from 'react';
import './algebra-tiles.css';
import { useSessionInputLogger } from './SessionLogContext';

const TILE_TYPES = [
  { id: 'one', label: '1', name: 'Μονάδα', className: 'unit' },
  { id: 'x', label: 'x', name: 'x', className: 'x' },
  { id: 'y', label: 'y', name: 'y', className: 'y' },
  { id: 'x2', label: 'x²', name: 'x²', className: 'x2' },
  { id: 'xy', label: 'xy', name: 'xy', className: 'xy' },
  { id: 'y2', label: 'y²', name: 'y²', className: 'y2' }
];

const TILE_SPANS = {
  one: [1, 1],
  x: [3, 1],
  y: [2, 1],
  x2: [3, 3],
  xy: [3, 2],
  y2: [2, 2]
};
const GRID_UNIT = 40;

function getTileSpans(type, orientation) {
  const [width, height] = TILE_SPANS[type] || [1, 1];
  if ((type === 'x' || type === 'y') && orientation === 'vertical') {
    return [height, width];
  }
  return [width, height];
}

export default function AlgebraTiles({ activity = '', tiles: sharedTiles, onTilesChange }) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const [localTiles, setLocalTiles] = useState([]);
  const tiles = Array.isArray(sharedTiles) ? sharedTiles : localTiles;

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
        <div className="algebra-tiles__placed"
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={dropTile}>
          {tiles.map((tile) => {
            const definition = TILE_TYPES.find((item) => item.id === tile.type);
            if (!definition) return null;
            return (
              <button key={tile.id} type="button" draggable={canEdit} disabled={!canEdit}
                onDragStart={(event) => beginTileDrag(event, tile)}
                onClick={() => removeTile(tile.id)}
                style={{ left: `${(tile.x || 0) * GRID_UNIT}px`, top: `${(tile.y || 0) * GRID_UNIT}px` }}
                className={`algebra-tile algebra-tile--${definition.className} is-${tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal')} ${tile.sign < 0 ? 'is-negative' : ''}`}
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
