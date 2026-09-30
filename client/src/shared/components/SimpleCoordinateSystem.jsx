import React, { useMemo } from 'react';
import './SimpleCoordinateSystem.css';

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

export default function SimpleCoordinateSystem({
  lines = [],
  width = 360,
  height = 300,
  xMin = -10,
  xMax = 10,
  yMin = -10,
  yMax = 10,
  showLegend = true,
  title = 'Οπτικοποίηση συστήματος'
}) {
  const safeWidth = Math.max(220, Number(width) || 360);
  const safeHeight = Math.max(200, Number(height) || 300);

  const normalizedLines = useMemo(() => {
    return (Array.isArray(lines) ? lines : [])
      .map((line, index) => {
        const m = Number(line?.m);
        const b = Number(line?.b);
        if (!Number.isFinite(m) || !Number.isFinite(b)) {
          return null;
        }

        return {
          id: line?.id || `line-${index}`,
          m,
          b,
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

    const linePaths = normalizedLines.map((line) => {
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
      xTicks: [xMin, -5, 0, 5, xMax].filter((value, index, arr) => arr.indexOf(value) === index),
      yTicks: [yMin, -5, 0, 5, yMax].filter((value, index, arr) => arr.indexOf(value) === index),
      toX,
      toY
    };
  }, [normalizedLines, safeHeight, safeWidth, xMax, xMin, yMax, yMin]);

  return (
    <section className="simple-coord" aria-label={title}>
      <header className="simple-coord__header">
        <h3>{title}</h3>
      </header>

      <svg className="simple-coord__svg" width={safeWidth} height={safeHeight} viewBox={`0 0 ${safeWidth} ${safeHeight}`} role="img" aria-label="Cartesian plot">
        <rect x="0" y="0" width={safeWidth} height={safeHeight} className="simple-coord__bg" />

        {draw.verticalGrid.map((column) => (
          <line key={`vx-${column.x}`} x1={column.px} y1={draw.padding.top} x2={column.px} y2={safeHeight - draw.padding.bottom} className="simple-coord__grid" />
        ))}

        {draw.horizontalGrid.map((row) => (
          <line key={`hy-${row.y}`} x1={draw.padding.left} y1={row.py} x2={safeWidth - draw.padding.right} y2={row.py} className="simple-coord__grid" />
        ))}

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

        {draw.xTicks.map((x) => (
          <text key={`tx-${x}`} x={draw.toX(x)} y={safeHeight - 8} className="simple-coord__tick" textAnchor="middle">{formatNumber(x)}</text>
        ))}
        {draw.yTicks.map((y) => (
          <text key={`ty-${y}`} x={8} y={draw.toY(y) + 4} className="simple-coord__tick">{formatNumber(y)}</text>
        ))}

        <text x={safeWidth - 12} y={draw.axisY - 8} className="simple-coord__axis-label">x</text>
        <text x={draw.axisX + 8} y={draw.padding.top + 12} className="simple-coord__axis-label">y</text>
      </svg>

      {showLegend ? (
        <ul className="simple-coord__legend">
          {normalizedLines.map((line) => (
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
