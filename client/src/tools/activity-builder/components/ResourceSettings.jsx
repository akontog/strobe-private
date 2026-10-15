import React from 'react';

function updateRow(rows, index, property, value) {
  return rows.map((row, rowIndex) => rowIndex === index ? { ...row, [property]: value } : row);
}

function addRow(rows, row) {
  return [...rows, row];
}

function removeRow(rows, index) {
  return rows.filter((_, rowIndex) => rowIndex !== index);
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
  const card = config.labCard || {};
  const updateProps = (nextProps) => onChange({ ...config, props: nextProps });
  const updateCard = (nextCard) => onChange({ ...config, labCard: nextCard });

  return (
    <section className="activity-resource-settings">
      <h3>{t('activityBuilder.resourceSettings')}</h3>

      {resource === 'input-grid' ? (
        <>
          <TextField
            label={t('activityBuilder.columns')}
            type="number"
            value={props.columns}
            onChange={(columns) => updateProps({ ...props, columns: Math.max(1, Number(columns) || 1) })}
          />
          <TextField label={t('activityBuilder.className')} value={props.className} onChange={(className) => updateProps({ ...props, className })} />
          <TextField label={t('activityBuilder.labelClassName')} value={props.labelClassName} onChange={(labelClassName) => updateProps({ ...props, labelClassName })} />
          <CheckField label={t('activityBuilder.customLayout')} checked={props.customLayout} onChange={(customLayout) => updateProps({ ...props, customLayout })} />
          <div className="activity-builder-rows">
            <h4>{t('activityBuilder.inputFields')}</h4>
            {(props.fields || []).map((field, index) => (
              <div className="activity-builder-row" key={field.id || index}>
                <TextField
                  label={t('activityBuilder.fieldId')}
                  value={field.id}
                  onChange={(id) => updateProps({ ...props, fields: updateRow(props.fields, index, 'id', id) })}
                />
                <TextField
                  label={t('activityBuilder.fieldLabel')}
                  value={field.label}
                  onChange={(label) => updateProps({ ...props, fields: updateRow(props.fields, index, 'label', label) })}
                />
                <TextField
                  label={t('activityBuilder.fieldPlaceholder')}
                  value={field.placeholder}
                  onChange={(placeholder) => updateProps({ ...props, fields: updateRow(props.fields, index, 'placeholder', placeholder) })}
                />
                <label>
                  {t('activityBuilder.fieldType')}
                  <select value={field.type || 'text'} onChange={(event) => updateProps({ ...props, fields: updateRow(props.fields, index, 'type', event.target.value) })}>
                    <option value="text">{t('activityBuilder.textType')}</option>
                    <option value="number">{t('activityBuilder.numberType')}</option>
                  </select>
                </label>
                <TextField
                  label={t('activityBuilder.correctAnswer')}
                  value={field.correctAnswer}
                  onChange={(correctAnswer) => updateProps({ ...props, fields: updateRow(props.fields, index, 'correctAnswer', correctAnswer) })}
                />
                <button type="button" onClick={() => updateProps({ ...props, fields: removeRow(props.fields, index) })}>
                  {t('activityBuilder.remove')}
                </button>
              </div>
            ))}
            <button type="button" onClick={() => updateProps({
              ...props,
              fields: addRow(props.fields || [], {
                id: `field-${(props.fields || []).length + 1}`,
                label: `${t('activityBuilder.fieldLabel')} ${(props.fields || []).length + 1}`,
                placeholder: '',
                type: 'text',
                correctAnswer: ''
              })
            })}>
              {t('activityBuilder.addField')}
            </button>
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
          <TextField label={t('activityBuilder.className')} value={props.className} onChange={(className) => updateProps({ ...props, className })} />
          {[
            'showStatus', 'showLegend', 'showToolBar', 'showAlgebraView', 'showAlgebraInput',
            'showMenuBar', 'showResetIcon', 'showZoomButtons', 'showFullscreenButton', 'showSuggestionButtons'
          ].map((key) => (
            <CheckField key={key} label={t(`activityBuilder.${key}`)} checked={props[key]} onChange={(checked) => updateProps({ ...props, [key]: checked })} />
          ))}
        </>
      ) : null}

      <div className="activity-builder-card-settings">
        <h4>{t('activityBuilder.labCard')}</h4>
        <label>
          {t('activityBuilder.cardDisplay')}
          <select value={card.type || 'icon'} onChange={(event) => updateCard({ ...card, type: event.target.value })}>
            <option value="icon">{t('activityBuilder.cardIcon')}</option>
            <option value="expression">{t('activityBuilder.cardExpression')}</option>
          </select>
        </label>
        {card.type !== 'expression' ? (
          <TextField label={t('activityBuilder.icon')} value={card.icon} onChange={(icon) => updateCard({ ...card, icon })} />
        ) : (
          <TextField label={t('activityBuilder.expression')} value={card.expression} onChange={(expression) => updateCard({ ...card, expression })} />
        )}
      </div>
    </section>
  );
}
