import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, OrderingBoard } from '../../shared/components';
import './OrderingBoardTool.css';

const DEFAULT_CONFIG = {
  rows: 2,
  grading: { mode: 'strict' },
  items: [
    [
      { id: 'step-1', content: 'Step 1', initialOrder: 2, correctOrder: 1 },
      { id: 'step-2', content: 'Step 2', initialOrder: 3, correctOrder: 2 },
      { id: 'step-3', content: 'Step 3', initialOrder: 1, correctOrder: 3 }
    ],
    [
      { id: 'number-1', content: '1', initialOrder: 3, correctOrder: 1 },
      { id: 'number-2', content: '2', initialOrder: 1, correctOrder: 2 },
      { id: 'number-3', content: '3', initialOrder: 2, correctOrder: 3 }
    ]
  ]
};

function createItemsForRow(rowIndex) {
  return [1, 2, 3].map((number) => ({
    id: `row-${rowIndex + 1}-item-${number}`,
    content: `Item ${number}`,
    initialOrder: number,
    correctOrder: number
  }));
}

function moveRank(items, itemId, key, rank) {
  const ordered = [...items].sort((left, right) => Number(left[key]) - Number(right[key]));
  const currentIndex = ordered.findIndex((item) => item.id === itemId);
  if (currentIndex < 0) return items;
  const [item] = ordered.splice(currentIndex, 1);
  ordered.splice(Math.max(0, Math.min(ordered.length, Number(rank) - 1)), 0, item);
  return ordered.map((entry, index) => ({ ...entry, [key]: index + 1 }));
}

/** Provides a configurable Ordering Board activity workspace. */
export default function OrderingBoardTool({ role = 'teacher' }) {
  const { t: tNav } = useTranslation('navigation');
  const { t } = useTranslation('interface');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [orderings, setOrderings] = useState({});

  function updateRowItems(rowIndex, update) {
    setConfig((current) => ({
      ...current,
      items: current.items.map((row, index) => index === rowIndex ? update(row) : row)
    }));
    setOrderings({});
  }

  function changeRowCount(value) {
    const rows = Math.max(1, Math.min(50, Number(value) || 1));
    setConfig((current) => ({
      ...current,
      rows,
      items: Array.from({ length: rows }, (_, index) => current.items[index] || createItemsForRow(index))
    }));
    setOrderings({});
  }

  function addItem(rowIndex) {
    updateRowItems(rowIndex, (row) => {
      const number = row.length + 1;
      const id = `row-${rowIndex + 1}-item-${Date.now()}`;
      return [...row, { id, content: `Item ${number}`, initialOrder: number, correctOrder: number }];
    });
  }

  function updateItem(rowIndex, itemId, changes) {
    updateRowItems(rowIndex, (row) => row.map((item) => item.id === itemId ? { ...item, ...changes } : item));
  }

  function removeItem(rowIndex, itemId) {
    updateRowItems(rowIndex, (row) => {
      const remaining = row.filter((item) => item.id !== itemId);
      return ['initialOrder', 'correctOrder'].reduce((items, key) => {
        const sorted = [...items].sort((left, right) => Number(left[key]) - Number(right[key]));
        return sorted.map((item, index) => ({ ...item, [key]: index + 1 }));
      }, remaining);
    });
  }

  function changeItemRank(rowIndex, itemId, key, rank) {
    updateRowItems(rowIndex, (row) => moveRank(row, itemId, key, rank));
  }

  function changeItemType(rowIndex, item) {
    if (item.image) {
      updateRowItems(rowIndex, (row) => row.map((entry) => {
        if (entry.id !== item.id) return entry;
        const next = { ...entry, content: item.image.alt || '' };
        delete next.image;
        return next;
      }));
    } else {
      updateItem(rowIndex, item.id, { content: '', image: { src: '', alt: '' } });
    }
  }

  return <section className="dashboard-page">
    <div className="dashboard-shell">
      <ActivitySettingsAccordion resource="ordering-board" role={role} defaultTitle={tNav('items.orderingBoard', { defaultValue: 'Ordering Board' })} config={config}>
        <OrderingBoard {...config} orderings={orderings} onChange={setOrderings} activity="ordering-board-preview" />
      </ActivitySettingsAccordion>
      {['teacher', 'admin'].includes(String(role).toLowerCase()) ? <Accordion title={t('activityResourceSettings', { ns: 'common' })} icon="Sort">
        <div className="ordering-board-settings">
          <label className="ordering-board-settings__row-count">
            <span>Πλήθος σειρών</span>
            <input type="number" min="1" max="50" step="1" value={config.rows} onChange={(event) => changeRowCount(event.target.value)} />
          </label>
          <label className="ordering-board-settings__separator">
            <span>Σύμβολο ανάμεσα στα αντικείμενα</span>
            <input type="text" value={config.separator || ''} placeholder="Κενό για κανένα σύμβολο" onChange={(event) => {
              setConfig((current) => ({ ...current, separator: event.target.value }));
              setOrderings({});
            }} />
          </label>
          <p className="ordering-board-settings__help">Η αρχική θέση ορίζει τη σειρά εμφάνισης. Η σωστή θέση χρησιμοποιείται για τη βαθμολόγηση. Κάθε σειρά ρυθμίζεται ανεξάρτητα.</p>
          {config.items.map((row, rowIndex) => <fieldset className="ordering-board-settings__row" key={`row-${rowIndex + 1}`}>
            <legend>Σειρά {rowIndex + 1}</legend>
            <div className="ordering-board-settings__items">
              {row.map((item) => <article className="ordering-board-settings__item" key={item.id}>
                <div className="ordering-board-settings__item-content">
                  <label>
                    <span>Τύπος</span>
                    <select value={item.image ? 'image' : 'text'} onChange={() => changeItemType(rowIndex, item)}>
                      <option value="text">Κείμενο</option>
                      <option value="image">Εικόνα</option>
                    </select>
                  </label>
                  {item.image ? <>
                    <label><span>Διεύθυνση εικόνας</span><input type="text" value={item.image.src || ''} onChange={(event) => updateItem(rowIndex, item.id, { image: { ...item.image, src: event.target.value } })} /></label>
                    <label><span>Περιγραφή εικόνας</span><input type="text" value={item.image.alt || ''} onChange={(event) => updateItem(rowIndex, item.id, { image: { ...item.image, alt: event.target.value } })} /></label>
                  </> : <label><span>Αντικείμενο</span><input type="text" value={item.content || ''} onChange={(event) => updateItem(rowIndex, item.id, { content: event.target.value })} /></label>}
                </div>
                <label className="ordering-board-settings__rank">
                  <span>Αρχική θέση</span>
                  <input type="number" min="1" max={row.length} value={item.initialOrder} onChange={(event) => changeItemRank(rowIndex, item.id, 'initialOrder', event.target.value)} />
                </label>
                <label className="ordering-board-settings__rank">
                  <span>Σωστή θέση</span>
                  <input type="number" min="1" max={row.length} value={item.correctOrder} onChange={(event) => changeItemRank(rowIndex, item.id, 'correctOrder', event.target.value)} />
                </label>
                <button type="button" className="ordering-board-settings__remove" disabled={row.length <= 1} onClick={() => removeItem(rowIndex, item.id)}>Αφαίρεση</button>
              </article>)}
            </div>
            <button type="button" onClick={() => addItem(rowIndex)}>Προσθήκη αντικειμένου</button>
          </fieldset>)}
        </div>
      </Accordion> : null}
    </div>
  </section>;
}
