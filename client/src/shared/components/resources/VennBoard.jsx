import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import MathFormula from '../primitives/MathFormula';
import GroupingItemBank from '../primitives/GroupingItemBank';
import './VennBoard.css';

const BANK_ZONE_ID = '__bank__';

export default function VennBoard({
  items = [],
  sets = [{ id: 'set-a', title: 'A' }, { id: 'set-b', title: 'B' }],
  diagram = null,
  placements = {},
  activity = '',
  onChange,
  disabled = false,
  invalidItemIds = [],
  disabledItemIds = [],
  bankLabel = ''
}) {
  const sessionLogging = useSessionInputLogger();
  const canEdit = sessionLogging?.canEdit ?? true;
  const interactionDisabled = disabled || !canEdit;
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hoverZoneId, setHoverZoneId] = useState(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const ignoreClickUntilRef = useRef(0);
  const validSets = (diagram?.sets || sets).slice(0, 2);
  const diagramType = diagram?.type || (validSets.length === 1 ? 'single' : 'overlap');
  const isSingleSet = diagramType === 'single' || validSets.length === 1;
  const isNested = diagramType === 'nested' && validSets.length === 2;
  const regions = useMemo(() => Array.isArray(diagram?.regions) ? diagram.regions : isSingleSet ? [
    { id: 'inside', title: validSets[0]?.title || validSets[0]?.id || 'A' },
    { id: 'outside', title: 'Outside the set' }
  ] : [
    { id: 'left', title: `${validSets[0]?.title || validSets[0]?.id || 'A'} only` },
    { id: 'intersection', title: `${validSets[0]?.title || validSets[0]?.id || 'A'} \u2229 ${validSets[1]?.title || validSets[1]?.id || 'B'}` },
    { id: 'right', title: `${validSets[1]?.title || validSets[1]?.id || 'B'} only` },
    { id: 'outside', title: 'Neither set' }
  ], [diagram?.regions, isSingleSet, validSets]);
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
      const placement = placements?.[item.id];
      const regionId = typeof placement === 'object' ? placement?.region : placement;
      if (regionIds.has(regionId)) state[regionId].push(item);
      else state[BANK_ZONE_ID].push(item);
    });
    return state;
  }, [items, placements, regions, regionIds]);

  const resolveDropTarget = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    if (element.closest('[data-group-bank="true"]')) return BANK_ZONE_ID;
    const diagram = element.closest('.venn-board__diagram');
    if (diagram) {
      const bounds = diagram.getBoundingClientRect();
      const x = ((clientX - bounds.left) / bounds.width) * 100;
      const y = ((clientY - bounds.top) / bounds.height) * 60 / 0.85;
      if (isNested) {
        const innerSet = validSets.find((set) => set.subsetOf);
        const parentSet = validSets.find((set) => set.id === innerSet?.subsetOf) || validSets.find((set) => set !== innerSet);
        const memberIds = (region) => (Array.isArray(region.members) ? region.members : []);
        const nestedRegion = (members) => regions.find((region) => {
          const configured = memberIds(region).slice().sort();
          const target = members.slice().sort();
          return configured.length === target.length && configured.every((id, index) => id === target[index]);
        });
        const inInnerSet = ((x - 50) / 17) ** 2 + ((y - 32) / 17) ** 2 <= 1;
        const inParentSet = ((x - 50) / 29) ** 2 + ((y - 32) / 29) ** 2 <= 1;
        if (inInnerSet) return nestedRegion([parentSet.id, innerSet.id])?.id || 'subset';
        if (inParentSet) return nestedRegion([parentSet.id])?.id || 'superset-only';
        const outside = nestedRegion([]);
        return {
          region: outside?.id || 'outside',
          x: Math.max(2, Math.min(98, ((clientX - bounds.left) / bounds.width) * 100)),
          y: Math.max(4, Math.min(96, ((clientY - bounds.top) / bounds.height) * 100))
        };
      }
      if (isSingleSet) {
        const inSet = ((x - 50) / 23) ** 2 + ((y - 31) / 28) ** 2 <= 1;
        if (inSet) return 'inside';
        return {
          region: 'outside',
          x: Math.max(2, Math.min(98, ((clientX - bounds.left) / bounds.width) * 100)),
          y: Math.max(4, Math.min(96, ((clientY - bounds.top) / bounds.height) * 100))
        };
      }
      const inSetA = ((x - 38) / 25) ** 2 + ((y - 28) / 25) ** 2 <= 1;
      const inSetB = ((x - 62) / 25) ** 2 + ((y - 28) / 25) ** 2 <= 1;
      if (inSetA && inSetB) return 'intersection';
      if (inSetA) return 'left';
      if (inSetB) return 'right';
      return {
        region: 'outside',
        x: Math.max(2, Math.min(98, ((clientX - bounds.left) / bounds.width) * 100)),
        y: Math.max(4, Math.min(96, ((clientY - bounds.top) / bounds.height) * 100))
      };
    }
    return null;
  };

  const moveItemToZone = (itemId, zoneId) => {
    if (!itemId || !zoneId || interactionDisabled) return;
    const nextPlacement = zoneId === BANK_ZONE_ID ? null : zoneId;
    const nextRegionId = nextPlacement && typeof nextPlacement === 'object' ? nextPlacement.region : nextPlacement;
    if (JSON.stringify(placements?.[itemId] ?? null) === JSON.stringify(nextPlacement)) return;
    onChange?.({ ...placements, [itemId]: nextPlacement });
    sessionLogging?.logEvent('grouping.item.moved', activity, {
      itemId: String(itemId),
      from: (typeof placements?.[itemId] === 'object' ? placements[itemId]?.region : placements?.[itemId]) || BANK_ZONE_ID,
      to: nextRegionId || BANK_ZONE_ID,
      ...(nextPlacement && typeof nextPlacement === 'object' ? { position: { x: nextPlacement.x, y: nextPlacement.y } } : {})
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

  const renderItem = (item, itemStyle) => {
    const isDragging = draggingItemId === item.id;
    const isSelected = selectedItemId === item.id;
    const isInvalid = invalidSet.has(item.id);
    const isItemDisabled = disabledSet.has(item.id);
    return (
      <button
        key={item.id}
        type="button"
        className={`grouping-dd-item${isSelected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isInvalid ? ' is-invalid' : ''}${isItemDisabled ? ' is-locked' : ''}`}
        style={itemStyle && typeof itemStyle === 'object' ? itemStyle : undefined}
        onPointerDown={(event) => handlePointerDown(event, item.id)}
        onClick={(event) => {
          event.stopPropagation();
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
  const handleDiagramClick = (event) => {
    const regionId = resolveDropTarget(event.clientX, event.clientY);
    if (regionId && regionId !== BANK_ZONE_ID) handleRegionClick(regionId);
  };
  const draggingItem = items.find((item) => item.id === draggingItemId) || null;

  return (
    <div className="venn-board" role="application" aria-label="Venn diagram activity">
      <div className={`venn-board__diagram${isSingleSet ? ' venn-board__diagram--single' : ''}${isNested ? ' venn-board__diagram--nested' : ''}`} onClick={handleDiagramClick}>
        <span className="venn-board__universe-label" aria-label="Ω"><MathFormula formula={'\\(\\Omega\\)'} /></span>
        <svg className="venn-board__circles" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          {isSingleSet ? <ellipse cx="50" cy="31" rx="23" ry="28" /> : isNested ? <><circle cx="50" cy="32" r="29" /><circle cx="50" cy="32" r="17" /></> : <><circle cx="38" cy="28" r="25" /><circle cx="62" cy="28" r="25" /></>}
        </svg>
        {validSets.map((set, index) => (
          <span key={set.id} className={`venn-board__set-label venn-board__set-label--${isSingleSet ? 'single' : isNested ? (set.subsetOf ? 'nested-child' : 'nested-parent') : index === 0 ? 'left' : 'right'}`}>
            {set.title || set.id}
          </span>
        ))}
        <div className="venn-board__regions">
          {regions.map((region) => (
            <section
              key={region.id}
              className={`venn-board__region venn-board__region--${region.id}${hoverZoneId === region.id ? ' is-hovering' : ''}`}
              data-venn-drop-id={region.id}
              onClick={(event) => {
                const regionId = resolveDropTarget(event.clientX, event.clientY);
                if (regionId && regionId !== BANK_ZONE_ID) {
                  handleRegionClick(regionId);
                  event.stopPropagation();
                }
              }}
              aria-label={region.title}
            >
              <div className="venn-board__region-items">
                {groupedState[region.id].map((item) => {
                  if (region.id !== 'outside') return renderItem(item);
                  const placement = placements?.[item.id];
                  return renderItem(item, {
                    left: `${placement?.x ?? 50}%`,
                    top: `${placement?.y ?? 88}%`
                  });
                })}
              </div>
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
