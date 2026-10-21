import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import GroupingItemBank from '../primitives/GroupingItemBank';
import './VennBoard.css';

const BANK_ZONE_ID = '__bank__';

export default function VennBoard({
  items = [],
  sets = [{ id: 'set-a', title: 'A' }, { id: 'set-b', title: 'B' }],
  placements = {},
  activity = '',
  onChange,
  disabled = false,
  invalidItemIds = [],
  disabledItemIds = [],
  bankLabel = 'Items to place'
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const interactionDisabled = disabled || !canEdit;
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hoverZoneId, setHoverZoneId] = useState(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const ignoreClickUntilRef = useRef(0);
  const validSets = sets.slice(0, 2);
  const regions = useMemo(() => [
    { id: 'left', title: `${validSets[0]?.title || validSets[0]?.id || 'A'} only` },
    { id: 'intersection', title: `${validSets[0]?.title || validSets[0]?.id || 'A'} ∩ ${validSets[1]?.title || validSets[1]?.id || 'B'}` },
    { id: 'right', title: `${validSets[1]?.title || validSets[1]?.id || 'B'} only` },
    { id: 'outside', title: 'Neither set' }
  ], [validSets]);
  const regionIds = useMemo(() => new Set(regions.map((region) => region.id)), [regions]);
  const invalidSet = useMemo(() => new Set(invalidItemIds), [invalidItemIds]);
  const disabledSet = useMemo(() => new Set(disabledItemIds), [disabledItemIds]);

  useEffect(() => {
    const clearOnSessionStart = (event) => {
      if (event.detail?.clear && canEdit) onChange?.({});
    };
    window.addEventListener('strobe:session-starting', clearOnSessionStart);
    return () => window.removeEventListener('strobe:session-starting', clearOnSessionStart);
  }, [canEdit, onChange]);

  const groupedState = useMemo(() => {
    const state = { [BANK_ZONE_ID]: [] };
    regions.forEach((region) => { state[region.id] = []; });
    items.forEach((item) => {
      const regionId = placements?.[item.id];
      if (regionIds.has(regionId)) state[regionId].push(item);
      else state[BANK_ZONE_ID].push(item);
    });
    return state;
  }, [items, placements, regions, regionIds]);

  const resolveDropTarget = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    const region = element.closest('[data-venn-drop-id]');
    if (region) return region.getAttribute('data-venn-drop-id');
    if (element.closest('[data-group-bank="true"]')) return BANK_ZONE_ID;
    return null;
  };

  const moveItemToZone = (itemId, zoneId) => {
    if (!itemId || !zoneId || interactionDisabled) return;
    const nextRegionId = zoneId === BANK_ZONE_ID ? null : zoneId;
    if (placements?.[itemId] === nextRegionId) return;
    onChange?.({ ...placements, [itemId]: nextRegionId });
    sessionLogging?.logEvent('grouping.item.moved', activity, {
      itemId: String(itemId),
      from: placements?.[itemId] || BANK_ZONE_ID,
      to: nextRegionId || BANK_ZONE_ID
    });
  };

  useEffect(() => {
    if (!draggingItemId) return undefined;
    const handlePointerMove = (event) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
      setHoverZoneId(resolveDropTarget(event.clientX, event.clientY));
    };
    const stopDrag = (event) => {
      moveItemToZone(draggingItemId, resolveDropTarget(event.clientX, event.clientY));
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
  }, [draggingItemId, placements, regionIds, interactionDisabled, activity, onChange, sessionLogging]);

  const handlePointerDown = (event, itemId) => {
    if (interactionDisabled || disabledSet.has(itemId)) return;
    event.preventDefault();
    setDraggingItemId(itemId);
    setDragPoint({ x: event.clientX, y: event.clientY });
    setHoverZoneId(null);
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
        onPointerDown={(event) => handlePointerDown(event, item.id)}
        onClick={() => {
          if (interactionDisabled || isItemDisabled || Date.now() < ignoreClickUntilRef.current) return;
          setSelectedItemId((previous) => previous === item.id ? null : item.id);
        }}
        disabled={interactionDisabled || isItemDisabled}
      >
        {item.content ?? item.label ?? item.id}
      </button>
    );
  };

  const handleRegionClick = (regionId) => {
    if (!interactionDisabled && selectedItemId) {
      moveItemToZone(selectedItemId, regionId);
      setSelectedItemId(null);
    }
  };
  const draggingItem = items.find((item) => item.id === draggingItemId) || null;

  return (
    <div className="venn-board" role="application" aria-label="Venn diagram activity">
      <div className="venn-board__diagram">
        <svg className="venn-board__circles" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="38" cy="28" r="25" />
          <circle cx="62" cy="28" r="25" />
        </svg>
        {validSets.map((set, index) => (
          <span key={set.id} className={`venn-board__set-label venn-board__set-label--${index === 0 ? 'left' : 'right'}`}>
            {set.title || set.id}
          </span>
        ))}
        <div className="venn-board__regions">
          {regions.map((region) => (
            <section
              key={region.id}
              className={`venn-board__region venn-board__region--${region.id}${hoverZoneId === region.id ? ' is-hovering' : ''}`}
              data-venn-drop-id={region.id}
              onClick={() => handleRegionClick(region.id)}
              aria-label={region.title}
            >
              <span className="venn-board__region-label">{region.title}</span>
              <div className="venn-board__region-items">{groupedState[region.id].map(renderItem)}</div>
            </section>
          ))}
        </div>
      </div>
      <GroupingItemBank
        items={groupedState[BANK_ZONE_ID]}
        renderItem={renderItem}
        label={bankLabel}
        isHovering={hoverZoneId === BANK_ZONE_ID}
        onClick={() => {
          if (selectedItemId) {
            moveItemToZone(selectedItemId, BANK_ZONE_ID);
            setSelectedItemId(null);
          }
        }}
      />
      {draggingItem ? <div className="grouping-dd-ghost" style={{ left: dragPoint.x, top: dragPoint.y }} aria-hidden="true">{draggingItem.content ?? draggingItem.label ?? draggingItem.id}</div> : null}
    </div>
  );
}
