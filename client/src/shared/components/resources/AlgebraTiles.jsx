import React, { useEffect, useRef, useState } from 'react';
import './AlgebraTiles.css';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import MathJaxText from '../primitives/MathJaxText';

const TILE_TYPES = [
  { id: 'one', label: '1', name: 'Μονάδα', className: 'unit' },
  { id: 'x', label: 'x', name: 'x', className: 'x' },
  { id: 'y', label: 'y', name: 'y', className: 'y' },
  { id: 'x2', label: 'x²', name: 'x²', className: 'x2' },
  { id: 'xy', label: 'xy', name: 'xy', className: 'xy' },
  { id: 'y2', label: 'y²', name: 'y²', className: 'y2' }
];

function getTileDefinition(type, variables) {
  const definition = TILE_TYPES.find((item) => item.id === type);
  if (!definition) return null;

  const { x, y } = variables;
  const labels = {
    x,
    y,
    x2: `${x}²`,
    xy: `${x}${y}`,
    y2: `${y}²`
  };

  return { ...definition, label: labels[type] || definition.label, name: labels[type] || definition.name };
}

const TILE_SPANS = {
  one: [2, 2],
  x: [6, 2],
  y: [4, 2],
  x2: [6, 6],
  xy: [6, 4],
  y2: [4, 4]
};
const GRID_UNIT = 20;
const T_CHART_AXIS_X = 120;
const T_CHART_AXIS_Y = 80;
const T_CHART_HORIZONTAL_ROW_Y = 40;
const T_CHART_VERTICAL_COLUMN_X = 80;

function normalizeMode(mode, layout) {
  const selectedMode = mode || layout;
  if (selectedMode === 'equation' || selectedMode === 'area' || selectedMode === 'simplified') return selectedMode;
  if (selectedMode === 't-chart') return 'area';
  return 'simplified';
}

function normalizeVariables(variables) {
  const variableList = Array.isArray(variables)
    ? variables
    : [variables?.x, variables?.y];
  return {
    x: String(variableList[0] || 'x'),
    y: String(variableList[1] || 'y')
  };
}

function getTileDimensions(type, orientation) {
  const [spanX, spanY] = getTileSpans(type, orientation);
  return { width: spanX * GRID_UNIT, height: spanY * GRID_UNIT };
}

function formatPolynomial(tiles, variables) {
  const powers = { x2: 0, xy: 0, y2: 0, x: 0, y: 0, one: 0 };
  tiles.forEach((tile) => {
    if (Object.hasOwn(powers, tile.type)) powers[tile.type] += tile.sign < 0 ? -1 : 1;
  });

  const terms = [
    ['x2', `${variables.x}²`], ['xy', `${variables.x}${variables.y}`],
    ['y2', `${variables.y}²`], ['x', variables.x], ['y', variables.y], ['one', '']
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
  if (['x', 'y', 'xy'].includes(type) && orientation === 'vertical') {
    return [height, width];
  }
  return [width, height];
}

function getTileBoardPosition(tile, mode, boardWidth) {
  const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
  const [spanX, spanY] = getTileSpans(tile.type, orientation);
  const left = mode === 'equation'
    ? (tile.side === 'right' ? boardWidth / 2 + 8 : 8) + (tile.x || 0) * GRID_UNIT
    : (tile.x || 0) * GRID_UNIT;
  const top = (tile.y || 0) * GRID_UNIT;
  const width = spanX * GRID_UNIT;
  const height = spanY * GRID_UNIT;
  return { left, top, width, height, centerX: left + width / 2, centerY: top + height / 2 };
}

export default function AlgebraTiles({
  activity = '', // Resource activity identifier used in input logs.
  tiles: sharedTiles, // Controlled tiles supplied by the parent.
  onTilesChange, // Reports tile updates to the parent.
  mode, // Selects equation, area, or simplified layout.
  layout, // Legacy layout option kept for existing callers.
  variables: variableNames = ['x', 'y'], // Names shown for the two tile variables.
  equationSides: suppliedEquationSides = null // Optional equation text shown on each side of the equation board.
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const variables = normalizeVariables(variableNames);
  const activeMode = normalizeMode(mode, layout);
  const [localTiles, setLocalTiles] = useState([]);
  const [sourceOrientations, setSourceOrientations] = useState({ x: 'horizontal', y: 'horizontal', xy: 'horizontal' });
  const [sourceSigns, setSourceSigns] = useState({ one: 1, x: 1, y: 1, x2: 1, xy: 1, y2: 1 });
  const [mergeAnimation, setMergeAnimation] = useState(null);
  const mergeTimerRef = useRef(null);
  const tiles = Array.isArray(sharedTiles) ? sharedTiles : localTiles;
  const isMerging = Boolean(mergeAnimation);

  useEffect(() => () => {
    if (mergeTimerRef.current) window.clearTimeout(mergeTimerRef.current);
  }, []);
  const areaTiles = activeMode === 'area'
    ? tiles.reduce((groups, tile) => {
      const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
      const { width, height } = getTileDimensions(tile.type, orientation);
      const centerX = (tile.x || 0) * GRID_UNIT + width / 2;
      const centerY = (tile.y || 0) * GRID_UNIT + height / 2;
      if (centerY < T_CHART_AXIS_Y && centerX >= T_CHART_AXIS_X) groups.horizontal.push(tile);
      else if (centerY >= T_CHART_AXIS_Y && centerX < T_CHART_AXIS_X) groups.vertical.push(tile);
      else if (centerY >= T_CHART_AXIS_Y && centerX >= T_CHART_AXIS_X) groups.product.push(tile);
      return groups;
    }, { horizontal: [], vertical: [], product: [] })
    : null;
  const tileEquationSides = activeMode === 'equation'
    ? {
      left: tiles.filter((tile) => tile.side === 'left'),
      right: tiles.filter((tile) => tile.side === 'right')
    }
    : null;
  const equationDisplaySides = suppliedEquationSides || tileEquationSides;
  const horizontalBounds = areaTiles?.horizontal.reduce((bounds, tile) => {
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
  const verticalBounds = areaTiles?.vertical.reduce((bounds, tile) => {
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

  const commitTiles = (nextTiles, logChange = true) => {
    if (!canEdit) return;
    setLocalTiles(nextTiles);
    onTilesChange?.(nextTiles);
    if (logChange) {
      sessionLogging?.logEvent('activity.tiles.changed', activity, {
        tiles: nextTiles.map(({ id, type, sign, orientation, x, y, side }) => ({ id, type, sign, orientation, x, y, side }))
      });
    }
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

  const rotateOrientation = (orientation) => orientation === 'vertical' ? 'horizontal' : 'vertical';

  const toggleTileSign = (tileId) => {
    commitTiles(tiles.map((tile) => tile.id === tileId ? { ...tile, sign: tile.sign < 0 ? 1 : -1 } : tile));
  };

  const renderSignButton = (sign, label, onClick, className = '') => (
    <button
      type="button"
      className={`algebra-tile__sign${className ? ` ${className}` : ''}`}
      aria-label={`Αλλαγή πρόσημου πλακιδίου ${label}`}
      disabled={!canEdit}
      draggable={false}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {sign < 0 ? '−' : '+'}
    </button>
  );

  const renderChoices = (type, key, orientation) => {
    const definition = getTileDefinition(type, variables);
    const canRotate = ['x', 'y', 'xy'].includes(type);
    const sign = sourceSigns[type] || 1;
    return (
      <div className={`algebra-tiles__choice-cell algebra-tiles__choice-cell--${type}`} key={key}>
        <div className={`algebra-tile-source-wrap${orientation === 'vertical' ? ' is-vertical' : ''}`}>
          <div
            className={`algebra-tile algebra-tile--source algebra-tile--${definition.className} is-${orientation} ${sign < 0 ? 'is-negative' : ''}`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            aria-label={`${orientation === 'vertical' ? 'Κατακόρυφο' : 'Οριζόντιο'} ${sign < 0 ? 'αρνητικό' : 'θετικό'} πλακίδιο ${definition.name}`}
            aria-disabled={!canEdit}
            draggable={canEdit}
            onDragStart={(event) => beginTileDrag(event, { type, sign, orientation })}>
            {definition.label}
            {renderSignButton(sign, definition.name, () => setSourceSigns((current) => ({ ...current, [type]: current[type] < 0 ? 1 : -1 })))}
            {canRotate ? <button type="button" className="algebra-tile__rotate" aria-label={`Περιστροφή πλακιδίου ${definition.name}`} disabled={!canEdit}
              draggable={false} onClick={(event) => {
                event.stopPropagation();
                setSourceOrientations((current) => ({ ...current, [type]: rotateOrientation(current[type]) }));
              }}>↻</button> : null}
          </div>
        </div>
      </div>
    );
  };

  const dropTile = (event) => {
    if (!canEdit || isMerging) return;
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
      let x = Math.max(0, Math.min(maxX, Math.round(rawX / GRID_UNIT)));
      let y = Math.max(0, Math.min(maxY, Math.round(rawY / GRID_UNIT)));
      let orientation = dragged.orientation;
      let side;

      if (activeMode === 'area') {
        const isFactorTile = ['one', 'x', 'y'].includes(dragged.type);
        if (rawY < T_CHART_AXIS_Y && isFactorTile) {
          orientation = dragged.type === 'one' ? orientation : 'horizontal';
          const [factorSpanX, factorSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_AXIS_X / GRID_UNIT;
          const minY = T_CHART_HORIZONTAL_ROW_Y / GRID_UNIT;
          const factorMaxX = Math.max(minX, Math.floor((board.clientWidth - factorSpanX * GRID_UNIT) / GRID_UNIT));
          x = Math.max(minX, Math.min(factorMaxX, Math.round(rawX / GRID_UNIT)));
          y = Math.min(Math.max(0, Math.floor((board.clientHeight - factorSpanY * GRID_UNIT) / GRID_UNIT)), minY);
        } else if (rawX < T_CHART_AXIS_X && isFactorTile) {
          orientation = dragged.type === 'one' ? orientation : 'vertical';
          const [factorSpanX, factorSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_VERTICAL_COLUMN_X / GRID_UNIT;
          const minY = T_CHART_AXIS_Y / GRID_UNIT;
          const factorMaxY = Math.max(minY, Math.floor((board.clientHeight - factorSpanY * GRID_UNIT) / GRID_UNIT));
          x = minX;
          y = Math.max(minY, Math.min(factorMaxY, Math.round(rawY / GRID_UNIT)));
        } else if (rawX >= T_CHART_AXIS_X && rawY >= T_CHART_AXIS_Y) {
          const [productSpanX, productSpanY] = getTileSpans(dragged.type, orientation);
          const minX = T_CHART_AXIS_X / GRID_UNIT;
          const minY = T_CHART_AXIS_Y / GRID_UNIT;
          const productMaxX = Math.max(minX, Math.floor((board.clientWidth - productSpanX * GRID_UNIT) / GRID_UNIT));
          const productMaxY = Math.max(minY, Math.floor((board.clientHeight - productSpanY * GRID_UNIT) / GRID_UNIT));
          x = Math.max(minX, Math.min(productMaxX, Math.round(rawX / GRID_UNIT)));
          y = Math.max(minY, Math.min(productMaxY, Math.round(rawY / GRID_UNIT)));
        } else {
          return;
        }
      } else if (activeMode === 'equation') {
        const midpoint = board.clientWidth / 2;
        side = rawX + tileWidth / 2 < midpoint ? 'left' : 'right';
        const sideOffset = side === 'right' ? midpoint : 0;
        const sideWidth = board.clientWidth / 2 - GRID_UNIT;
        const maxSideX = Math.max(0, Math.floor((sideWidth - tileWidth) / GRID_UNIT));
        x = Math.max(0, Math.min(maxSideX, Math.round((rawX - sideOffset) / GRID_UNIT)));
      }
      const id = dragged.id || `${Date.now()}-${Math.random()}`;
      const dropX = event.clientX - bounds.left + board.scrollLeft;
      const dropY = event.clientY - bounds.top + board.scrollTop;
      const oppositeTile = tiles.find((tile) => {
        if (tile.id === id || tile.type !== dragged.type || (tile.sign < 0) === (dragged.sign < 0)) return false;
        if (activeMode === 'equation' && tile.side !== side) return false;

        const tileOrientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
        const [existingWidth, existingHeight] = getTileSpans(tile.type, tileOrientation);
        const tileLeft = activeMode === 'equation'
          ? (tile.side === 'right' ? board.clientWidth / 2 + 8 : 8) + (tile.x || 0) * GRID_UNIT
          : (tile.x || 0) * GRID_UNIT;
        const tileTop = (tile.y || 0) * GRID_UNIT;
        return dropX >= tileLeft
          && dropX < tileLeft + existingWidth * GRID_UNIT
          && dropY >= tileTop
          && dropY < tileTop + existingHeight * GRID_UNIT;
      });
      const nextTiles = tiles.filter((tile) => tile.id !== id && tile.id !== oppositeTile?.id);
      const droppedTile = { id, type: dragged.type, sign: dragged.sign, orientation, x, y, ...(side ? { side } : {}) };
      if (oppositeTile) {
        const existingPosition = getTileBoardPosition(oppositeTile, activeMode, board.clientWidth);
        const droppedPosition = getTileBoardPosition(droppedTile, activeMode, board.clientWidth);
        const centerX = (existingPosition.centerX + droppedPosition.centerX) / 2;
        const centerY = (existingPosition.centerY + droppedPosition.centerY) / 2;
        const animation = {
          [oppositeTile.id]: {
            x: `${centerX - existingPosition.centerX}px`,
            y: `${centerY - existingPosition.centerY}px`
          },
          [droppedTile.id]: {
            x: `${centerX - droppedPosition.centerX}px`,
            y: `${centerY - droppedPosition.centerY}px`
          }
        };
        const mergingTiles = [...nextTiles, droppedTile];
        commitTiles(mergingTiles, false);
        setMergeAnimation(animation);
        mergeTimerRef.current = window.setTimeout(() => {
          commitTiles(mergingTiles.filter((tile) => tile.id !== oppositeTile.id && tile.id !== droppedTile.id));
          setMergeAnimation(null);
          mergeTimerRef.current = null;
        }, 300);
        return;
      }
      nextTiles.push(droppedTile);

      commitTiles(nextTiles);
    } catch {
      // Ignore drops that did not originate from an algebra tile.
    }
  };

  const removeTile = (id) => {
    if (isMerging) return;
    if (activeMode === 'equation') {
      const selectedTile = tiles.find((tile) => tile.id === id);
      if (!selectedTile) return;
      const matchingTile = tiles.find((tile) => tile.side !== selectedTile.side
        && tile.type === selectedTile.type
        && (tile.sign < 0) === (selectedTile.sign < 0));
      if (!matchingTile) return;
      commitTiles(tiles.filter((tile) => tile.id !== id && tile.id !== matchingTile.id));
      return;
    }
    commitTiles(tiles.filter((tile) => tile.id !== id));
  };
  return (
    <div className={`algebra-tiles${isMerging ? ' has-merging-tiles' : ''}`}>
      <section className={`algebra-tiles__board${activeMode === 'equation' ? ' algebra-tiles__board--equation' : ''}`} aria-label="Πίνακας πλακιδίων">
        {equationDisplaySides ? (
          <div className="algebra-tiles__equation-header" aria-live="polite">
            <output>{typeof equationDisplaySides.left === 'string'
              ? <MathJaxText text={equationDisplaySides.left} />
              : formatPolynomial(equationDisplaySides.left, variables)}</output>
            <output>{typeof equationDisplaySides.right === 'string'
              ? <MathJaxText text={equationDisplaySides.right} />
              : formatPolynomial(equationDisplaySides.right, variables)}</output>
            <span aria-hidden="true">=</span>
          </div>
        ) : null}
        <div className={`algebra-tiles__placed${activeMode === 'area' ? ' is-area' : ''}${activeMode === 'equation' ? ' is-equation' : ''}`}
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={dropTile}>
          {areaTiles?.horizontal.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--horizontal" style={{
              left: `${(horizontalBounds.left + horizontalBounds.right) / 2}px`,
              top: `${Math.max(0, horizontalBounds.top - 34)}px`
            }}>
              ({formatPolynomial(areaTiles.horizontal, variables)})
            </output>
          ) : null}
          {areaTiles?.vertical.length ? (
            <output className="algebra-tiles__factor algebra-tiles__factor--vertical" style={{
              left: `${Math.max(0, verticalBounds.left - 80)}px`,
              top: `${(verticalBounds.top + verticalBounds.bottom) / 2}px`
            }}>
              ({formatPolynomial(areaTiles.vertical, variables)})
            </output>
          ) : null}
          {areaTiles ? (
            <output className="algebra-tiles__product" aria-live="polite">
              {formatPolynomial(areaTiles.product, variables)}
            </output>
          ) : null}
          {tiles.map((tile) => {
            const definition = getTileDefinition(tile.type, variables);
            if (!definition) return null;
            const orientation = tile.orientation || (tile.type === 'y' ? 'vertical' : 'horizontal');
            const [spanX, spanY] = getTileSpans(tile.type, orientation);
            return (
              <div key={tile.id} role="button" tabIndex={canEdit ? 0 : -1} draggable={canEdit} aria-disabled={!canEdit}
                onDragStart={(event) => beginTileDrag(event, tile)}
                onClick={() => removeTile(tile.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') removeTile(tile.id); }}
                className={`algebra-tile algebra-tile--${definition.className} is-${orientation} ${tile.sign < 0 ? 'is-negative' : ''}${mergeAnimation?.[tile.id] ? ' is-merging' : ''}`}
                style={{
                  left: activeMode === 'equation'
                    ? `calc(${tile.side === 'right' ? '50% + ' : ''}8px + ${(tile.x || 0) * GRID_UNIT}px)`
                    : `${(tile.x || 0) * GRID_UNIT}px`,
                  top: `${(tile.y || 0) * GRID_UNIT}px`,
                  ...(orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type)
                    ? { boxSizing: 'border-box', width: `${spanX * GRID_UNIT}px`, height: `${spanY * GRID_UNIT}px` }
                    : {}),
                  ...(mergeAnimation?.[tile.id] ? {
                    '--merge-x': mergeAnimation[tile.id].x,
                    '--merge-y': mergeAnimation[tile.id].y
                  } : {})
                }}
                aria-label={`${tile.sign < 0 ? 'Αρνητικό' : 'Θετικό'} πλακίδιο ${definition.name}`}
                title={`${definition.name}: ${activeMode === 'equation'
                  ? 'Πάτησε για αφαίρεση ίσων πλακιδίων και από τις δύο πλευρές'
                  : 'Σύρε το πλακίδιο για μεταφορά ή πάτησε για αφαίρεση'}`}>
                {definition.label}
                {renderSignButton(tile.sign, definition.name, () => toggleTileSign(tile.id))}
                {['x', 'y', 'xy'].includes(tile.type) ? <button type="button" className="algebra-tile__rotate" aria-label={`Περιστροφή πλακιδίου ${definition.name}`} disabled={!canEdit}
                  draggable={false} onClick={(event) => {
                    event.stopPropagation();
                    commitTiles(tiles.map((item) => item.id === tile.id ? { ...item, orientation: rotateOrientation(orientation) } : item));
                  }}>↻</button> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="algebra-tiles__palette" aria-label="Επιλογή πλακιδίων">
        {renderChoices('one', 'unit', 'horizontal')}
        {renderChoices('x', 'x', sourceOrientations.x)}
        {renderChoices('y', 'y', sourceOrientations.y)}
        {renderChoices('x2', 'x2', 'horizontal')}
        {renderChoices('xy', 'xy', sourceOrientations.xy)}
        {renderChoices('y2', 'y2', 'horizontal')}
      </section>
    </div>
  );
}
