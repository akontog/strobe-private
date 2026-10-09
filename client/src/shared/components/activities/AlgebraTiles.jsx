import React, { useMemo, useState } from 'react';
import './algebra-tiles.css';

const TILE_TYPES = [
  { id: 'one', label: '1', name: 'Μονάδα', className: 'unit' },
  { id: 'x', label: 'x', name: 'x', className: 'x' },
  { id: 'y', label: 'y', name: 'y', className: 'y' },
  { id: 'x2', label: 'xΒ²', name: 'xΒ²', className: 'x2' },
  { id: 'xy', label: 'xy', name: 'xy', className: 'xy' },
  { id: 'y2', label: 'yΒ²', name: 'yΒ²', className: 'y2' }
];

const EXAMPLES = {
  linear: [
    ...Array.from({ length: 3 }, (_, i) => ({ id: `x-${i}`, type: 'x', sign: 1 })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: `one-${i}`, type: 'one', sign: 1 }))
  ],
  quadratic: [
    ...Array.from({ length: 2 }, (_, i) => ({ id: `x2-${i}`, type: 'x2', sign: 1 })),
    { id: 'x-neg', type: 'x', sign: -1 },
    ...Array.from({ length: 4 }, (_, i) => ({ id: `one-${i}`, type: 'one', sign: 1 }))
  ]
};

function signedTerm(count, term) {
  if (!count) return '';
  const sign = count < 0 ? '−' : '+';
  const amount = Math.abs(count);
  const value = term === '1' ? String(amount) : `${amount === 1 ? '' : amount}${term}`;
  return { sign, value };
}

function formatPolynomial(counts, keys) {
  const terms = keys.map((key) => signedTerm(counts[key] || 0, key === 'one' ? '1' : ({ x2: 'xΒ²', y2: 'yΒ²', xy: 'xy' }[key] || key))).filter(Boolean);
  if (!terms.length) return '0';
  return terms.map((term, index) => `${index === 0 ? (term.sign === '−' ? '−' : '') : ` ${term.sign} `}${term.value}`).join('');
}

function factorPair(b, c) {
  for (let m = -12; m <= 12; m += 1) {
    for (let n = m; n <= 12; n += 1) {
      if (m + n === b && m * n === c) return [m, n];
    }
  }
  return null;
}

function factorText(value) {
  if (value === 0) return 'x';
  return value > 0 ? `x + ${value}` : `x − ${Math.abs(value)}`;
}

const TILE_SPANS = { one: [1, 1], x: [3, 1], y: [1, 3], x2: [3, 3], xy: [3, 3], y2: [3, 3] };
const GRID_UNIT = 40;

function exampleTiles(initialExample) {
  return (EXAMPLES[initialExample] || EXAMPLES.linear).map((tile, index) => ({
    ...tile,
    id: `${initialExample}-${tile.id}`,
    x: initialExample === 'quadratic'
      ? (index < 2 ? index * 3 : index === 2 ? 6 : index - 3)
      : (index < 3 ? index * 3 : index - 3),
    y: initialExample === 'quadratic' ? (index < 3 ? 0 : 4) : (index < 3 ? 0 : 2)
  }));
}

export default function AlgebraTiles({ initialExample = 'linear', canvasMode = 'multiplication', tiles: sharedTiles, onTilesChange }) {
  const [localTiles, setLocalTiles] = useState(() => exampleTiles(initialExample));
  const tiles = Array.isArray(sharedTiles) ? sharedTiles : localTiles;
  const [mode, setMode] = useState('tiles');
  const [sideA, setSideA] = useState(2);
  const [sideB, setSideB] = useState(3);
  const [factorB, setFactorB] = useState(5);
  const [factorC, setFactorC] = useState(6);

  const counts = useMemo(() => tiles.reduce((total, tile) => {
    total[tile.type] = (total[tile.type] || 0) + tile.sign;
    return total;
  }, {}), [tiles]);

  const commitTiles = (nextTiles) => {
    setLocalTiles(nextTiles);
    onTilesChange?.(nextTiles);
  };
  const addTile = (type, sign) => {
    const nextIndex = tiles.length;
    commitTiles([...tiles, { id: `${Date.now()}-${Math.random()}`, type, sign, x: (nextIndex % 8) * 3, y: Math.floor(nextIndex / 8) * 3 }]);
  };
  const loadExample = (example) => commitTiles(exampleTiles(example));
  const removeTile = (id) => commitTiles(tiles.filter((tile) => tile.id !== id));
  const beginTileDrag = (event, tile, isPalette = false) => {
    event.dataTransfer.effectAllowed = isPalette ? 'copy' : 'move';
    const serialized = JSON.stringify({
      id: isPalette ? '' : tile.id,
      type: tile.type,
      sign: tile.sign,
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY
    });
    event.dataTransfer.setData('application/x-algebra-tile', serialized);
    event.dataTransfer.setData('text/plain', serialized);
  };
  const dropTile = (event) => {
    event.preventDefault();
    try {
      const serialized = event.dataTransfer.getData('application/x-algebra-tile') || event.dataTransfer.getData('text/plain');
      const dragged = JSON.parse(serialized);
      const board = event.currentTarget.getBoundingClientRect();
      const [spanX, spanY] = TILE_SPANS[dragged.type] || [1, 1];
      const maxX = Math.max(0, Math.floor((board.width - spanX * GRID_UNIT) / GRID_UNIT));
      const maxY = Math.max(0, Math.floor((board.height - spanY * GRID_UNIT) / GRID_UNIT));
      const x = Math.max(0, Math.min(maxX, Math.round((event.clientX - board.left - dragged.offsetX) / GRID_UNIT)));
      const y = Math.max(0, Math.min(maxY, Math.round((event.clientY - board.top - dragged.offsetY) / GRID_UNIT)));
      const id = dragged.id || `${Date.now()}-${Math.random()}`;
      const next = tiles.filter((tile) => tile.id !== id).concat({ id, type: dragged.type, sign: dragged.sign, x, y });
      commitTiles(next);
    } catch {
      // Ignore drops that did not originate from an algebra tile.
    }
  };
  const pair = factorPair(Number(factorB), Number(factorC));

  return (
    <div className="algebra-tiles">
      <header className="algebra-tiles__intro">
        <div><p className="algebra-tiles__eyebrow">ALGEBRA TILES</p><h2>Πλακίδια άλγεβρας</h2>
          <p>Θετικά πλακίδια σε μπλε, αρνητικά σε κόκκινο. Πάτησε τα πλακίδια στον πίνακα για να τα αφαιρέσεις.</p>
        </div>
        <nav className="algebra-tiles__modes" aria-label="Είδος μοντέλου">
          <button type="button" className={mode === 'tiles' ? 'is-active' : ''} onClick={() => setMode('tiles')}>Πλακίδια</button>
          <button type="button" className={mode === 'multiply' ? 'is-active' : ''} onClick={() => setMode('multiply')}>Πολλαπλασιασμός</button>
          <button type="button" className={mode === 'factor' ? 'is-active' : ''} onClick={() => setMode('factor')}>Παραγοντοποίηση</button>
        </nav>
      </header>

      {mode === 'tiles' ? (
        <>
          <div className="algebra-tiles__examples">
            <span>Παραδείγματα:</span>
            <button type="button" onClick={() => loadExample('linear')}>3x + 2</button>
            <button type="button" onClick={() => loadExample('quadratic')}>2x² − x + 4</button>
            <button type="button" onClick={() => setTiles([])}>Καθαρισμός</button>
          </div>
          <div className="algebra-tiles__palette">
            {TILE_TYPES.map((tile) => (
              <div className="algebra-tiles__palette-item" key={tile.id}>
                <span className={`algebra-tile algebra-tile--${tile.className}`} aria-hidden="true" draggable
                  onDragStart={(event) => beginTileDrag(event, { type: tile.id, sign: 1 }, true)}>{tile.label}</span>
                <span className={`algebra-tile algebra-tile--${tile.className} is-negative algebra-tiles__negative-source`} aria-hidden="true" draggable
                  onDragStart={(event) => beginTileDrag(event, { type: tile.id, sign: -1 }, true)}>{tile.label}</span>
                <strong>{tile.name}</strong>
                <div><button type="button" aria-label={`Προσθήκη θετικού ${tile.name}`} onClick={() => addTile(tile.id, 1)}>+ Προσθήκη</button>
                  <button type="button" aria-label={`Προσθήκη αρνητικού ${tile.name}`} onClick={() => addTile(tile.id, -1)}>− Προσθήκη</button></div>
              </div>
            ))}
          </div>
          <section className="algebra-tiles__board" aria-label="Κοινός καμβάς πλακιδίων">
            <div className="algebra-tiles__board-title"><h3>Πίνακας</h3><output>{formatPolynomial(counts, ['x2', 'xy', 'y2', 'x', 'y', 'one'])}</output></div>
            <div className={`algebra-tiles__placed algebra-tiles__placed--${canvasMode}`}
              onDragOver={(event) => event.preventDefault()} onDrop={dropTile}>
              {tiles.map((tile) => {
                const definition = TILE_TYPES.find((item) => item.id === tile.type);
                return <button key={tile.id} type="button" draggable
                  onDragStart={(event) => beginTileDrag(event, tile)}
                  style={{ left: `${(tile.x || 0) * GRID_UNIT}px`, top: `${(tile.y || 0) * GRID_UNIT}px` }}
                  className={`algebra-tile algebra-tile--${definition.className} ${tile.sign < 0 ? 'is-negative' : ''}`}
                  title="Σύρε το πλακίδιο για μεταφορά ή πάτησε για αφαίρεση" onClick={() => removeTile(tile.id)}>{definition.label}</button>;
              })}
              {!tiles.length ? <span className="algebra-tiles__empty">Πρόσθεσε πλακίδια από την παλέτα.</span> : null}
            </div>
          </section>
        </>
      ) : null}

      {mode === 'multiply' ? (
        <section className="algebra-tiles__model">
          <div className="algebra-tiles__controls">
            <h3>Μοντέλο ορθογωνίου</h3>
            <label>Πλευρά A: x + <input type="number" min="0" max="8" value={sideA} onChange={(event) => setSideA(Math.max(0, Math.min(8, Number(event.target.value))))} /></label>
            <label>Πλευρά B: x + <input type="number" min="0" max="8" value={sideB} onChange={(event) => setSideB(Math.max(0, Math.min(8, Number(event.target.value))))} /></label>
            <strong>(x + {sideA})(x + {sideB}) = xΒ² + {sideA + sideB}x + {sideA * sideB}</strong>
          </div>
          <div className="algebra-tiles__area" aria-label="Ανάλυση εμβαδού">
            <div className="algebra-tiles__area-cell algebra-tiles__area-cell--square">xΒ²</div>
            <div className="algebra-tiles__area-cell algebra-tiles__area-cell--x">{sideB}x</div>
            <div className="algebra-tiles__area-cell algebra-tiles__area-cell--x">{sideA}x</div>
            <div className="algebra-tiles__area-cell algebra-tiles__area-cell--unit">{sideA * sideB}</div>
          </div>
        </section>
      ) : null}

      {mode === 'factor' ? (
        <section className="algebra-tiles__model algebra-tiles__factor">
          <div className="algebra-tiles__controls"><h3>Αντίστροφο μοντέλο: παραγοντοποίηση</h3>
            <p>Βρες δύο αριθμούς με άθροισμα τον συντελεστή του x και γινόμενο τον σταθερό όρο.</p>
            <label>Συντελεστής x <input type="number" value={factorB} onChange={(event) => setFactorB(event.target.value)} /></label>
            <label>Σταθερός όρος <input type="number" value={factorC} onChange={(event) => setFactorC(event.target.value)} /></label>
          </div>
          <div className="algebra-tiles__factor-result">
            <span>x² {Number(factorB) < 0 ? '−' : '+'} {Math.abs(Number(factorB) || 0)}x {Number(factorC) < 0 ? '−' : '+'} {Math.abs(Number(factorC) || 0)}</span>
            {pair ? (
              <>
                <strong>= ({factorText(pair[0])})({factorText(pair[1])})</strong>
                <div className="algebra-tiles__area" aria-label="Αντίστροφο μοντέλο πλακιδίων">
                  <div className="algebra-tiles__area-cell algebra-tiles__area-cell--square">xΒ²</div>
                  <div className={`algebra-tiles__area-cell algebra-tiles__area-cell--x ${pair[1] < 0 ? 'is-negative' : ''}`}>{pair[1]}x</div>
                  <div className={`algebra-tiles__area-cell algebra-tiles__area-cell--x ${pair[0] < 0 ? 'is-negative' : ''}`}>{pair[0]}x</div>
                  <div className={`algebra-tiles__area-cell algebra-tiles__area-cell--unit ${pair[0] * pair[1] < 0 ? 'is-negative' : ''}`}>{pair[0] * pair[1]}</div>
                </div>
              </>
            ) : <strong>Δεν υπάρχει ακέραια παραγοντοποίηση για αυτούς τους συντελεστές.</strong>}
          </div>
        </section>
      ) : null}
    </div>
  );
}

