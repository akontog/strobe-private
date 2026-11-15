import React, { useEffect, useMemo, useState } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './OrderingBoard.css';

function getItemContent(item) {
  const content = item.content ?? item.label ?? item.value ?? item.id;
  if (item.image || (content && typeof content === 'object' && content.type === 'image')) {
    const image = item.image || content;
    return <img src={typeof image === 'string' ? image : image.src} alt={image.alt || ''} />;
  }
  return typeof content === 'object' ? JSON.stringify(content) : content;
}

function getRowOrder(row, orderings) {
  const ids = new Set(row.items.map((item) => String(item.id)));
  const current = Array.isArray(orderings[row.id]) ? orderings[row.id].map(String).filter((id) => ids.has(id)) : [];
  row.items.forEach((item) => {
    if (!current.includes(String(item.id))) current.push(String(item.id));
  });
  return current;
}

function scoreOrdering(row, order) {
  const correct = [...row.items]
    .sort((left, right) => Number(left.correctOrder) - Number(right.correctOrder))
    .map((item) => String(item.id));
  const positions = new Map(order.map((id, index) => [id, index]));
  let correctPairs = 0;
  let totalPairs = 0;
  for (let first = 0; first < correct.length; first += 1) {
    for (let second = first + 1; second < correct.length; second += 1) {
      totalPairs += 1;
      if (positions.get(correct[first]) < positions.get(correct[second])) correctPairs += 1;
    }
  }
  return {
    correct: order.length === correct.length && correct.every((id, index) => order[index] === id),
    correctPairs,
    totalPairs
  };
}

function isAfterTarget(event, element) {
  const bounds = element.getBoundingClientRect();
  return event.clientY > bounds.top + bounds.height / 2
    || (event.clientY >= bounds.top && event.clientY <= bounds.bottom
      && event.clientX > bounds.left + bounds.width / 2);
}

/** Renders independently sortable rows and reports each row's item order. */
export default function OrderingBoard({
  rows = 1,
  items = [],
  separator = '',
  orderings = {},
  onChange,
  activity = '',
  disabled = false
}) {
  const session = useSessionInputLogger();
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const [hoverItem, setHoverItem] = useState(null);
  const canEdit = (session?.canEdit ?? true) && !disabled;
  const rowItems = useMemo(() => {
    const definitions = Array.isArray(rows)
      ? rows
      : Array.from({ length: Math.max(0, Math.min(50, Number(rows) || 0)) }, (_, index) => ({
        id: `row-${index + 1}`,
        items: Array.isArray(items[index]) ? items[index] : []
      }));
    return definitions.map((row, index) => ({
      ...row,
      id: String(row.id || `row-${index + 1}`),
      items: [...(Array.isArray(row.items) ? row.items : [])]
        .sort((left, right) => Number(left.initialOrder) - Number(right.initialOrder))
        .map((item, itemIndex) => ({ ...item, id: String(item.id || `item-${itemIndex + 1}`) }))
    }));
  }, [rows, items]);

  function moveItem(row, itemId, targetId = null, insertAfter = false) {
    if (!canEdit) return;
    const currentOrder = getRowOrder(row, orderings);
    const fromIndex = currentOrder.indexOf(itemId);
    if (fromIndex < 0 || itemId === targetId) return;
    const nextOrder = [...currentOrder];
    nextOrder.splice(fromIndex, 1);
    const targetIndex = targetId ? nextOrder.indexOf(targetId) : nextOrder.length;
    if (targetIndex < 0) return;
    nextOrder.splice(targetIndex + (targetId && insertAfter ? 1 : 0), 0, itemId);
    const nextOrderings = { ...orderings, [row.id]: nextOrder };
    onChange?.(nextOrderings);
    session?.logEvent('activity.input.changed', activity, {
      field: `ordering:${row.id}`,
      value: JSON.stringify(nextOrder),
      ...scoreOrdering(row, nextOrder)
    });
  }

  useEffect(() => {
    if (!draggedItem) return undefined;
    const handlePointerMove = (event) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const beforeTarget = element?.closest('[data-ordering-before]');
      const afterTarget = element?.closest('[data-ordering-after]');
      const target = beforeTarget || afterTarget || element?.closest('[data-ordering-item]');
      if (!target || target.dataset.orderingRowId !== draggedItem.rowId || target.dataset.orderingItemId === draggedItem.itemId) {
        setHoverItem(null);
        return;
      }
      setHoverItem({
        rowId: draggedItem.rowId,
        itemId: beforeTarget?.dataset.orderingBefore || afterTarget?.dataset.orderingAfter || target.dataset.orderingItemId,
        isAfter: !beforeTarget && (Boolean(afterTarget) || isAfterTarget(event, target))
      });
    };
    const stopDrag = (event) => {
      if (event.type === 'pointerup') {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const targetRow = target?.closest('[data-ordering-row-id]');
        const beforeTarget = target?.closest('[data-ordering-before]');
        const afterTarget = target?.closest('[data-ordering-after]');
        const targetItem = beforeTarget || afterTarget || target?.closest('[data-ordering-item]');
        if (targetRow?.dataset.orderingRowId === draggedItem.rowId) {
          const row = rowItems.find((entry) => entry.id === draggedItem.rowId);
          if (row && targetItem?.dataset.orderingRowId === draggedItem.rowId) {
            moveItem(
              row,
              draggedItem.itemId,
              beforeTarget?.dataset.orderingBefore || afterTarget?.dataset.orderingAfter || targetItem.dataset.orderingItemId,
              !beforeTarget && (Boolean(afterTarget) || isAfterTarget(event, targetItem))
            );
          } else if (row) {
            moveItem(row, draggedItem.itemId);
          }
        }
      }
      setDraggedItem(null);
      setHoverItem(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [draggedItem, rowItems, orderings, canEdit, activity, session, onChange]);

  return <div className="ordering-board">
    {rowItems.map((row, index) => {
      const order = getRowOrder(row, orderings);
      const itemsById = new Map(row.items.map((item) => [item.id, item]));
      return <section className="ordering-board__row" key={row.id} aria-label={row.title || `Row ${index + 1}`} data-ordering-row-id={row.id}>
        {row.title ? <h2 className="ordering-board__row-title">{row.title}</h2> : null}
        <ol className="ordering-board__items">
          {order.length > 0 ? <li className={`ordering-board__start-drop${hoverItem?.rowId === row.id && hoverItem.itemId === order[0] && !hoverItem.isAfter ? ' is-hovering' : ''}`} role="presentation">
            <span aria-hidden="true" data-ordering-before={order[0]} data-ordering-row-id={row.id} />
          </li> : null}
          {order.map((itemId, itemIndex) => {
            const item = itemsById.get(itemId);
            if (!item) return null;
            const isDragging = draggedItem?.rowId === row.id && draggedItem.itemId === itemId;
            const isHovering = hoverItem?.rowId === row.id && hoverItem.itemId === itemId;
            return <React.Fragment key={itemId}>
              <li
                className={`ordering-board__item${isDragging ? ' is-dragging' : ''}${isHovering ? hoverItem.isAfter ? ' is-hovering-after' : ' is-hovering-before' : ''}`}
                data-ordering-item
                data-ordering-row-id={row.id}
                data-ordering-item-id={itemId}
                onPointerDown={(event) => {
                  if (!canEdit || event.button !== 0) return;
                  event.preventDefault();
                  setDraggedItem({ rowId: row.id, itemId });
                  setDragPoint({ x: event.clientX, y: event.clientY });
                }}>
                <span className="ordering-board__content">{getItemContent(item)}</span>
              </li>
              {separator && itemIndex < order.length - 1 ? <li className="ordering-board__separator" role="presentation">
                <span
                  aria-hidden="true"
                  data-ordering-after={itemId}
                  data-ordering-row-id={row.id}
                >{separator}</span>
              </li> : null}
            </React.Fragment>;
          })}
        </ol>
      </section>;
    })}
    {draggedItem ? (() => {
      const item = rowItems.find((row) => row.id === draggedItem.rowId)?.items.find((entry) => entry.id === draggedItem.itemId);
      return item ? <div className="ordering-board__ghost" style={{ left: dragPoint.x, top: dragPoint.y }} aria-hidden="true">{getItemContent(item)}</div> : null;
    })() : null}
  </div>;
}
