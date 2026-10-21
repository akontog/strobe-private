import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import GroupingItemBank from '../primitives/GroupingItemBank';
import './PlacementBoard.css';

const BANK_ZONE_ID = '__bank__';

const getPlacement = (placements, itemId, groupIds) => {
  const candidate = placements?.[itemId];
  return groupIds.has(candidate) ? candidate : null;
};

export default function PlacementBoard({
  items = [], // Draggable items shown in the bank and groups.
  groups = [], // Drop zones available to the items.
  placements = {}, // Current item-to-group assignments.
  activity = '', // Activity identifier used in input logs.
  onChange, // Reports updated assignments to the parent.
  disabled = false, // Disables all drag and drop interactions.
  invalidItemIds = [], // Item IDs currently marked as incorrectly placed.
  disabledItemIds = [], // Item IDs that cannot be moved.
  bankLabel = 'Αντικείμενα προς ομαδοποίηση', // Label shown above the ungrouped items.
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const interactionDisabled = disabled || !canEdit;
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hoverZoneId, setHoverZoneId] = useState(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const ignoreClickUntilRef = useRef(0);

  useEffect(() => {
    const clearOnSessionStart = (event) => {
      if (event.detail?.clear && canEdit) onChange?.({});
    };
    window.addEventListener('strobe:session-starting', clearOnSessionStart);
    return () => window.removeEventListener('strobe:session-starting', clearOnSessionStart);
  }, [canEdit, onChange]);

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
    if (!itemId || interactionDisabled) {
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
    sessionLogging?.logEvent('grouping.item.moved', activity, {
      itemId: String(itemId),
      from: currentGroupId || BANK_ZONE_ID,
      to: nextGroupId || BANK_ZONE_ID
    });
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
  }, [draggingItemId, placements, groupIds, interactionDisabled, activity, onChange, sessionLogging]);

  const handleItemPointerDown = (event, itemId) => {
    if (interactionDisabled || disabledSet.has(itemId)) {
      return;
    }

    event.preventDefault();
    setDraggingItemId(itemId);
    setDragPoint({ x: event.clientX, y: event.clientY });
    setHoverZoneId(null);
  };

  const handleItemClick = (itemId) => {
    if (interactionDisabled || disabledSet.has(itemId) || Date.now() < ignoreClickUntilRef.current) {
      return;
    }

    setSelectedItemId((previous) => (previous === itemId ? null : itemId));
  };

  const handleZoneClick = (zoneId) => {
    if (interactionDisabled || !selectedItemId) {
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
        disabled={interactionDisabled || isItemDisabled}
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
                {group.title ? <p className="grouping-dd-zone-title">{group.title}</p> : null}
                {group.hint && <div className="grouping-dd-zone-hint">{group.hint}</div>}
              </header>
              <div className="grouping-dd-zone-body">
                {groupedState[group.id].length > 0
                  ? groupedState[group.id].map(renderItem)
                  : null}
              </div>
            </section>
          );
        })}
      </div>

      <GroupingItemBank
        items={groupedState[BANK_ZONE_ID]}
        renderItem={renderItem}
        label={bankLabel}
        isHovering={hoverZoneId === BANK_ZONE_ID}
        onClick={() => handleZoneClick(BANK_ZONE_ID)}
      />

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
