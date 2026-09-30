import React, { useEffect, useMemo, useRef, useState } from 'react';
import './GroupingDragDrop.css';

const BANK_ZONE_ID = '__bank__';

const getPlacement = (placements, itemId, groupIds) => {
  const candidate = placements?.[itemId];
  return groupIds.has(candidate) ? candidate : null;
};

export default function GroupingDragDrop({
  items = [],
  groups = [],
  placements = {},
  onChange,
  disabled = false,
  invalidItemIds = [],
  disabledItemIds = [],
  bankLabel = 'Αντικείμενα προς ομαδοποίηση',
  emptyZoneLabel = 'Σύρε αντικείμενα εδώ'
}) {
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hoverZoneId, setHoverZoneId] = useState(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const ignoreClickUntilRef = useRef(0);

  const groupIds = useMemo(() => new Set(groups.map((group) => group.id)), [groups]);
  const invalidSet = useMemo(() => new Set(invalidItemIds), [invalidItemIds]);
  const disabledSet = useMemo(() => new Set(disabledItemIds), [disabledItemIds]);

  const groupedState = useMemo(() => {
    const state = {
      [BANK_ZONE_ID]: []
    };

    groups.forEach((group) => {
      state[group.id] = [];
    });

    items.forEach((item) => {
      const targetGroupId = getPlacement(placements, item.id, groupIds);
      if (!targetGroupId || !state[targetGroupId]) {
        state[BANK_ZONE_ID].push(item);
        return;
      }

      state[targetGroupId].push(item);
    });

    return state;
  }, [groups, items, placements, groupIds]);

  const resolveDropTarget = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) {
      return null;
    }

    const zoneElement = element.closest('[data-group-drop-id]');
    if (zoneElement) {
      return zoneElement.getAttribute('data-group-drop-id');
    }

    const bankElement = element.closest('[data-group-bank="true"]');
    if (bankElement) {
      return BANK_ZONE_ID;
    }

    return null;
  };

  const moveItemToZone = (itemId, zoneId) => {
    if (!itemId || disabled) {
      return;
    }

    const nextGroupId = zoneId === BANK_ZONE_ID ? null : zoneId;
    const currentGroupId = getPlacement(placements, itemId, groupIds);

    if (currentGroupId === nextGroupId) {
      return;
    }

    const nextPlacements = {
      ...placements,
      [itemId]: nextGroupId
    };

    onChange?.(nextPlacements);
  };

  useEffect(() => {
    if (!draggingItemId) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
      setHoverZoneId(resolveDropTarget(event.clientX, event.clientY));
    };

    const stopDrag = (event) => {
      const dropZoneId = resolveDropTarget(event.clientX, event.clientY);
      moveItemToZone(draggingItemId, dropZoneId);
      setDraggingItemId(null);
      setHoverZoneId(null);
      setSelectedItemId(null);
      ignoreClickUntilRef.current = Date.now() + 150;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [draggingItemId, placements, groupIds]);

  const handleItemPointerDown = (event, itemId) => {
    if (disabled || disabledSet.has(itemId)) {
      return;
    }

    event.preventDefault();
    setDraggingItemId(itemId);
    setDragPoint({ x: event.clientX, y: event.clientY });
    setHoverZoneId(null);
  };

  const handleItemClick = (itemId) => {
    if (disabled || disabledSet.has(itemId) || Date.now() < ignoreClickUntilRef.current) {
      return;
    }

    setSelectedItemId((previous) => (previous === itemId ? null : itemId));
  };

  const handleZoneClick = (zoneId) => {
    if (disabled || !selectedItemId) {
      return;
    }

    moveItemToZone(selectedItemId, zoneId);
    setSelectedItemId(null);
  };

  const renderItem = (item) => {
    const isDragging = draggingItemId === item.id;
    const isSelected = selectedItemId === item.id;
    const isInvalid = invalidSet.has(item.id);
    const isItemDisabled = disabledSet.has(item.id);

    return (
      <button
        key={item.id}
        type="button"
        className={`grouping-dd-item${isSelected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isInvalid ? ' is-invalid' : ''}${isItemDisabled ? ' is-locked' : ''}`}
        onPointerDown={(event) => handleItemPointerDown(event, item.id)}
        onClick={() => handleItemClick(item.id)}
        disabled={disabled || isItemDisabled}
      >
        {item.content}
      </button>
    );
  };

  const draggingItem = items.find((item) => item.id === draggingItemId) || null;

  return (
    <div className="grouping-dd" role="application" aria-label="drag and drop grouping activity">
      <div className="grouping-dd-zones">
        {groups.map((group) => {
          const isHovering = hoverZoneId === group.id;
          return (
            <section
              key={group.id}
              className={`grouping-dd-zone${isHovering ? ' is-hovering' : ''}`}
              data-group-drop-id={group.id}
              onClick={() => handleZoneClick(group.id)}
              aria-label={group.title || group.id}
            >
              <header className="grouping-dd-zone-head">
                <p className="grouping-dd-zone-title">{group.title || 'Ομάδα'}</p>
                {group.hint && <div className="grouping-dd-zone-hint">{group.hint}</div>}
              </header>
              <div className="grouping-dd-zone-body">
                {groupedState[group.id].length > 0
                  ? groupedState[group.id].map(renderItem)
                  : <p className="grouping-dd-empty">{emptyZoneLabel}</p>}
              </div>
            </section>
          );
        })}
      </div>

      <section
        className={`grouping-dd-bank${hoverZoneId === BANK_ZONE_ID ? ' is-hovering' : ''}`}
        data-group-bank="true"
        onClick={() => handleZoneClick(BANK_ZONE_ID)}
      >
        <p className="grouping-dd-bank-title">{bankLabel}</p>
        <div className="grouping-dd-bank-items">
          {groupedState[BANK_ZONE_ID].length > 0
            ? groupedState[BANK_ZONE_ID].map(renderItem)
            : <p className="grouping-dd-empty">Όλα τα αντικείμενα έχουν τοποθετηθεί.</p>}
        </div>
      </section>

      {draggingItem && (
        <div
          className="grouping-dd-ghost"
          style={{ left: dragPoint.x, top: dragPoint.y }}
          aria-hidden="true"
        >
          {draggingItem.content}
        </div>
      )}
    </div>
  );
}
