import React from 'react';
import ResourceLayoutPreview from './ResourceLayoutPreview';

function updateRow(rows, index, property, value) {
  return rows.map((row, rowIndex) => rowIndex === index ? { ...row, [property]: value } : row);
}

function addRow(rows, row) {
  return [...rows, row];
}

function removeRow(rows, index) {
  return rows.filter((_, rowIndex) => rowIndex !== index);
}

function resizeGridFields(fields, rows, columns, t) {
  const current = new Map((fields || []).map((field) => [`${field.row}:${field.column}`, field]));
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns) + 1;
    const column = (index % columns) + 1;
    return current.get(`${row}:${column}`) || {
      id: `cell-r${row}-c${column}`,
      row,
      column,
      label: t('activityBuilder.defaultInput', { index: index + 1 }),
      placeholder: '',
      type: 'text',
      correctAnswer: ''
    };
  });
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <label>
      {label}
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="activity-builder-check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function JsonArrayField({ label, value, onChange, invalidText }) {
  const [text, setText] = React.useState(JSON.stringify(value || [], null, 2));
  const [invalid, setInvalid] = React.useState(false);

  React.useEffect(() => {
    setText(JSON.stringify(value || [], null, 2));
    setInvalid(false);
  }, [value]);

  return (
    <label>
      {label}
      <textarea
        rows={6}
        value={text}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          try {
            const parsed = JSON.parse(nextText);
            if (Array.isArray(parsed)) {
              setInvalid(false);
              onChange(parsed);
            } else {
              setInvalid(true);
            }
          } catch {
            setInvalid(true);
          }
        }}
      />
      {invalid ? <span className="tool-error">{invalidText}</span> : null}
    </label>
  );
}

export default function ResourceSettings({ resource, value, onChange, t }) {
  const config = value || {};
  const props = config.props || {};
  const widgets = config.widgets || [];
  const updateProps = (nextProps) => onChange({ ...config, props: nextProps });
  const updateWidgets = (nextWidgets) => onChange({ ...config, widgets: nextWidgets });

  return (
    <section className="activity-resource-settings">
      <h3>{t('activityBuilder.resourceSettings')}</h3>
      <ResourceLayoutPreview
        resource={resource}
        props={props}
        widgets={widgets}
        onChangeWidgets={updateWidgets}
        t={t}
      />

      {resource === 'input-grid' ? (
        <>
          <TextField
            label={t('activityBuilder.rows')}
            type="number"
            value={props.rows}
            onChange={(value) => {
              const rows = Math.max(1, Math.min(20, Number(value) || 1));
              updateProps({ ...props, rows, fields: resizeGridFields(props.fields, rows, props.columns || 1, t) });
            }}
          />
          <TextField
            label={t('activityBuilder.columns')}
            type="number"
            value={props.columns}
            onChange={(value) => {
              const columns = Math.max(1, Math.min(20, Number(value) || 1));
              updateProps({ ...props, columns, fields: resizeGridFields(props.fields, props.rows || 1, columns, t) });
            }}
          />
          <div className="activity-builder-rows">
            <h4>{t('activityBuilder.inputFields')}</h4>
            {(props.fields || []).map((field, index) => (
              <div className="activity-builder-row" key={field.id || index}>
                <p className="activity-grid-coordinate">{t('activityBuilder.gridCell', { row: field.row || Math.floor(index / (props.columns || 1)) + 1, column: field.column || (index % (props.columns || 1)) + 1 })}</p>
                <TextField
                  label={t('activityBuilder.fieldLabel')}
                  value={field.label}
                  onChange={(label) => updateProps({ ...props, fields: updateRow(props.fields, index, 'label', label) })}
                />
                <TextField
                  label={t('activityBuilder.correctAnswer')}
                  value={field.correctAnswer}
                  onChange={(correctAnswer) => updateProps({ ...props, fields: updateRow(props.fields, index, 'correctAnswer', correctAnswer) })}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {resource === 'grouping-drag-drop' ? (
        <>
          <div className="activity-builder-rows">
            <h4>{t('activityBuilder.groups')}</h4>
            {(props.groups || []).map((group, index) => (
              <div className="activity-builder-row" key={group.id || index}>
                <TextField label={t('activityBuilder.groupId')} value={group.id} onChange={(id) => updateProps({ ...props, groups: updateRow(props.groups, index, 'id', id) })} />
                <TextField label={t('activityBuilder.groupLabel')} value={group.title} onChange={(title) => updateProps({ ...props, groups: updateRow(props.groups, index, 'title', title) })} />
                <button type="button" onClick={() => updateProps({ ...props, groups: removeRow(props.groups, index) })}>{t('activityBuilder.remove')}</button>
              </div>
            ))}
            <button type="button" onClick={() => updateProps({
              ...props,
              groups: addRow(props.groups || [], { id: `group-${(props.groups || []).length + 1}`, title: `${t('activityBuilder.groupLabel')} ${(props.groups || []).length + 1}` })
            })}>{t('activityBuilder.addGroup')}</button>
          </div>
          <div className="activity-builder-rows">
            <h4>{t('activityBuilder.items')}</h4>
            {(props.items || []).map((item, index) => (
              <div className="activity-builder-row" key={item.id || index}>
                <TextField label={t('activityBuilder.itemId')} value={item.id} onChange={(id) => updateProps({ ...props, items: updateRow(props.items, index, 'id', id) })} />
                <TextField label={t('activityBuilder.itemLabel')} value={item.content} onChange={(content) => updateProps({ ...props, items: updateRow(props.items, index, 'content', content) })} />
                <label>
                  {t('activityBuilder.correctGroup')}
                  <select
                    value={config.grading?.correctGroupByItem?.[item.id] || ''}
                    onChange={(event) => onChange({
                      ...config,
                      grading: {
                        ...config.grading,
                        correctGroupByItem: { ...config.grading?.correctGroupByItem, [item.id]: event.target.value }
                      }
                    })}
                  >
                    <option value="">{t('activityBuilder.chooseGroup')}</option>
                    {(props.groups || []).map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => updateProps({ ...props, items: removeRow(props.items, index) })}>{t('activityBuilder.remove')}</button>
              </div>
            ))}
            <button type="button" onClick={() => updateProps({
              ...props,
              items: addRow(props.items || [], { id: `item-${(props.items || []).length + 1}`, content: `${t('activityBuilder.itemLabel')} ${(props.items || []).length + 1}` })
            })}>{t('activityBuilder.addItem')}</button>
          </div>
          <TextField label={t('activityBuilder.bankLabel')} value={props.bankLabel} onChange={(bankLabel) => updateProps({ ...props, bankLabel })} />
        </>
      ) : null}

      {resource === 'algebra-tiles' ? (
        <>
          <TextField label={t('activityBuilder.activityId')} value={props.activity} onChange={(activity) => updateProps({ ...props, activity })} />
          <JsonArrayField
            label={t('activityBuilder.initialTiles')}
            value={props.tiles}
            onChange={(tiles) => updateProps({ ...props, tiles })}
            invalidText={t('activityBuilder.invalidTilesJson')}
          />
        </>
      ) : null}

      {resource === 'collaborative-geogebra' ? (
        <>
          <TextField label={t('activityBuilder.roomId')} value={props.roomId} onChange={(roomId) => updateProps({ ...props, roomId })} />
          {[
            'showStatus', 'showLegend', 'showToolBar', 'showAlgebraView', 'showAlgebraInput',
            'showMenuBar', 'showResetIcon', 'showZoomButtons', 'showFullscreenButton', 'showSuggestionButtons'
          ].map((key) => (
            <CheckField key={key} label={t(`activityBuilder.${key}`)} checked={props[key]} onChange={(checked) => updateProps({ ...props, [key]: checked })} />
          ))}
        </>
      ) : null}

    </section>
  );
}
