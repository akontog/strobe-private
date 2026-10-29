import React, { useMemo } from 'react';
import './PlotWidget.css';

const EPSILON = 1e-9;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.abs(value) < EPSILON ? 0 : value;
  if (Math.abs(rounded % 1) < EPSILON) {
    return String(Math.trunc(rounded));
  }

  return String(Math.round(rounded * 100) / 100);
}

export function parseLinearEquation(expression = '') {
  const source = String(expression).replace(/\s+/g, '').replace(/^y=/i, '');
  if (!source) return null;
  const match = source.match(/^([+-]?(?:\d*\.)?\d*)x(?:([+-](?:\d*\.)?\d+))?$/i);
  if (match) {
    const coefficient = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : Number(match[1]);
    const intercept = Number(match[2] || 0);
    return Number.isFinite(coefficient) && Number.isFinite(intercept) ? { m: coefficient, b: intercept } : null;
  }
  if (/^[+-]?(?:\d*\.)?\d+$/.test(source)) {
    const intercept = Number(source);
    return Number.isFinite(intercept) ? { m: 0, b: intercept } : null;
  }
  return null;
}

export default function PlotWidget({
  lines = [], // Lines drawn on the coordinate system.
  width = 360, // SVG width in pixels.
  height = 300, // SVG height in pixels.
  xMin = -10, // Minimum horizontal axis value.
  xMax = 10, // Maximum horizontal axis value.
  yMin = -10, // Minimum vertical axis value.
  yMax = 10, // Maximum vertical axis value.
  showLegend = true, // Shows the line legend when true.
  showGrid = true, // Shows the coordinate grid when true.
  axisLabels = { x: 'x', y: 'y' }, // Text displayed beside each coordinate axis.
  accessibleLabel = '', // Accessible description of the plot.
  graphItems = [], // Additional graph objects displayed on the plot.
  title = '' // Optional visible title. Use outer widget wrapper titles for consistency.
}) {
  const safeWidth = Math.max(220, Number(width) || 360);
  const safeHeight = Math.max(200, Number(height) || 300);

  const normalizedLines = useMemo(() => {
    return (Array.isArray(lines) ? lines : [])
      .map((line, index) => {
        const verticalX = Number(line?.verticalX);
        const m = Number(line?.m);
        const b = Number(line?.b);
        if (!Number.isFinite(verticalX) && (!Number.isFinite(m) || !Number.isFinite(b))) {
          return null;
        }

        return {
          id: line?.id || `line-${index}`,
          m,
          b,
          verticalX: Number.isFinite(verticalX) ? verticalX : null,
          color: line?.color || (index % 2 === 0 ? '#2563eb' : '#dc2626'),
          label: line?.label || `f${index + 1}`
        };
      })
      .filter(Boolean)
      .slice(0, 2);
  }, [lines]);

  const draw = useMemo(() => {
    const padding = { top: 20, right: 16, bottom: 26, left: 36 };
    const innerWidth = safeWidth - padding.left - padding.right;
    const innerHeight = safeHeight - padding.top - padding.bottom;

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const toX = (x) => padding.left + ((x - xMin) / xRange) * innerWidth;
    const toY = (y) => padding.top + ((yMax - y) / yRange) * innerHeight;

    const axisX = clamp(toX(0), padding.left, safeWidth - padding.right);
    const axisY = clamp(toY(0), padding.top, safeHeight - padding.bottom);

    const gridStep = 1;
    const verticalGrid = [];
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += gridStep) {
      verticalGrid.push({ x, px: toX(x) });
    }

    const horizontalGrid = [];
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += gridStep) {
      horizontalGrid.push({ y, py: toY(y) });
    }

    const equationLines = (Array.isArray(graphItems) ? graphItems : [])
      .filter((item) => item?.type === 'equation')
      .map((item, index) => {
        const parsed = parseLinearEquation(item.expression);
        return parsed ? { ...parsed, id: item.id || `equation-${index}`, color: item.color || '#2563eb', label: item.expression || `y${index + 1}` } : null;
      })
      .filter(Boolean);
    const linePaths = [...normalizedLines, ...equationLines].map((line) => {
      if (Number.isFinite(line.verticalX)) {
        const x = toX(line.verticalX);
        return {
          ...line,
          points: `${x},${toY(yMin)} ${x},${toY(yMax)}`
        };
      }

      const points = [];
      const sampleCount = 60;
      for (let step = 0; step <= sampleCount; step += 1) {
        const ratio = step / sampleCount;
        const x = xMin + ratio * (xMax - xMin);
        const y = line.m * x + line.b;
        points.push(`${toX(x)},${toY(y)}`);
      }

      return {
        ...line,
        points: points.join(' ')
      };
    });

    return {
      padding,
      axisX,
      axisY,
      verticalGrid,
      horizontalGrid,
      linePaths,
      pointItems: (Array.isArray(graphItems) ? graphItems : [])
        .filter((item) => item?.type === 'point' && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
        .map((item, index) => ({ ...item, id: item.id || `point-${index}`, x: Number(item.x), y: Number(item.y), color: item.color || '#dc2626' })),
      xTicks: [xMin, -5, 0, 5, xMax].filter((value, index, arr) => arr.indexOf(value) === index),
      yTicks: [yMin, -5, 0, 5, yMax].filter((value, index, arr) => arr.indexOf(value) === index),
      toX,
      toY
    };
  }, [graphItems, normalizedLines, safeHeight, safeWidth, xMax, xMin, yMax, yMin]);

  return (
    <section className="simple-coord" aria-label={accessibleLabel || title}>
      {title ? (
        <header className="simple-coord__header">
          <h3>{title}</h3>
        </header>
      ) : null}

      <svg className="simple-coord__svg" width={safeWidth} height={safeHeight} viewBox={`0 0 ${safeWidth} ${safeHeight}`} role="img" aria-label={accessibleLabel || title || 'Cartesian plot'}>
        <rect x="0" y="0" width={safeWidth} height={safeHeight} className="simple-coord__bg" />

        {showGrid ? draw.verticalGrid.map((column) => (
          <line key={`vx-${column.x}`} x1={column.px} y1={draw.padding.top} x2={column.px} y2={safeHeight - draw.padding.bottom} className="simple-coord__grid" />
        )) : null}

        {showGrid ? draw.horizontalGrid.map((row) => (
          <line key={`hy-${row.y}`} x1={draw.padding.left} y1={row.py} x2={safeWidth - draw.padding.right} y2={row.py} className="simple-coord__grid" />
        )) : null}

        <line x1={draw.padding.left} y1={draw.axisY} x2={safeWidth - draw.padding.right} y2={draw.axisY} className="simple-coord__axis" />
        <line x1={draw.axisX} y1={draw.padding.top} x2={draw.axisX} y2={safeHeight - draw.padding.bottom} className="simple-coord__axis" />

        {draw.linePaths.map((line) => (
          <polyline
            key={line.id}
            points={line.points}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {draw.pointItems.map((point) => (
          <circle key={point.id} cx={draw.toX(point.x)} cy={draw.toY(point.y)} r="4" fill={point.color} className="simple-coord__point" />
        ))}

        {draw.pointItems.filter((point) => point.showCoordinates !== false).map((point) => (
          <text key={`point-label-${point.id}`} x={draw.toX(point.x) + 7} y={draw.toY(point.y) - 7} className="simple-coord__point-label">
            ({formatNumber(point.x)}, {formatNumber(point.y)})
          </text>
        ))}

        {draw.xTicks.map((x) => (
          <text key={`tx-${x}`} x={draw.toX(x)} y={safeHeight - 8} className="simple-coord__tick" textAnchor="middle">{formatNumber(x)}</text>
        ))}
        {draw.yTicks.map((y) => (
          <text key={`ty-${y}`} x={8} y={draw.toY(y) + 4} className="simple-coord__tick">{formatNumber(y)}</text>
        ))}

        <text x={safeWidth - 12} y={draw.axisY - 8} className="simple-coord__axis-label">{axisLabels?.x ?? ''}</text>
        <text x={draw.axisX + 8} y={draw.padding.top + 12} className="simple-coord__axis-label">{axisLabels?.y ?? ''}</text>
      </svg>

      {showLegend ? (
        <ul className="simple-coord__legend">
          {normalizedLines.map((line) => (
            <li key={`legend-${line.id}`}>
              <span className="simple-coord__swatch" style={{ backgroundColor: line.color }} aria-hidden="true" />
              <span>{line.label}</span>
            </li>
          ))}
          {draw.pointItems.map((point) => (
            <li key={`legend-${point.id}`}>
              <span className="simple-coord__swatch simple-coord__swatch--point" style={{ backgroundColor: point.color }} aria-hidden="true" />
              <span>({formatNumber(point.x)}, {formatNumber(point.y)})</span>
            </li>
          ))}
          {draw.linePaths.filter((line) => !normalizedLines.some((legacyLine) => legacyLine.id === line.id)).map((line) => (
            <li key={`legend-${line.id}`}>
              <span className="simple-coord__swatch" style={{ backgroundColor: line.color }} aria-hidden="true" />
              <span>{line.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
