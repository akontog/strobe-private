(function initPostitCards(global) {
  const ReactRef = global.React;
  const ReactDOMRef = global.ReactDOM;

  if (!ReactRef || !ReactDOMRef) {
    return;
  }

  const h = ReactRef.createElement;
  const tones = ['violet', 'indigo', 'magenta', 'red', 'orange', 'amber', 'yellow', 'green', 'blue'];
  const rootsByNode = new WeakMap();

  function resolveTone(item, index) {
    if (item && item.tone) return item.tone;
    return tones[index % tones.length];
  }

  function actionNode(action, idx, item, onAction) {
    const className = action.variant === 'secondary' ? 'button-link secondary' : 'button-link';

    if (action.kind === 'button') {
      return h(
        'button',
        {
          key: `btn-${idx}`,
          type: 'button',
          className: action.variant === 'secondary' ? 'secondary' : '',
          onClick: function onClick(evt) {
            evt.stopPropagation();
            if (typeof onAction === 'function') {
              onAction(item, action, evt);
            }
          }
        },
        action.label
      );
    }

    return h(
      'a',
      {
        key: `link-${idx}`,
        className,
        href: action.href || '#',
        onClick: function onClick(evt) {
          evt.stopPropagation();
          if (action.href || typeof onAction !== 'function') return;
          evt.preventDefault();
          onAction(item, action, evt);
        }
      },
      action.label
    );
  }

  function StickyCard(props) {
    const item = props.item || {};
    const type = props.type || 'role';
    const clickable = Boolean(item.href || item.onClick || props.cardClickable);
    const tone = resolveTone(item, props.index || 0);

    const cardClass = [
      type === 'role' ? 'role-card' : 'app-card',
      'strobe-note',
      `strobe-note--${tone}`,
      clickable ? 'is-clickable' : ''
    ].join(' ').trim();

    const cardProps = {
      className: cardClass,
      'data-card-id': item.id || item.slug || item.title || ''
    };

    if (clickable) {
      cardProps.tabIndex = 0;
      cardProps.role = 'button';
      cardProps.onClick = function onClick(evt) {
        if (evt.target.closest('.btn-row')) return;

        if (typeof item.onClick === 'function') {
          item.onClick(item, evt);
          return;
        }

        if (item.href) {
          global.location.href = item.href;
        }
      };
      cardProps.onKeyDown = function onKeyDown(evt) {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          cardProps.onClick(evt);
        }
      };
    }

    if (type === 'role') {
      return h(
        'div',
        cardProps,
        item.icon ? h('span', { className: 'role-icon' }, item.icon) : null,
        h('div', { className: 'role-title' }, item.title || ''),
        item.description ? h('div', { className: 'role-description' }, item.description) : null,
        Array.isArray(item.features) && item.features.length
          ? h('ul', { className: 'role-features' }, item.features.map(function toLi(feature, idx) {
              return h('li', { key: `feature-${idx}` }, feature);
            }))
          : null
      );
    }

    const contentChildren = [];
    if (item.description) {
      contentChildren.push(h('div', { key: 'desc', className: 'app-desc' }, item.description));
    }

    if (Array.isArray(item.actions) && item.actions.length) {
      contentChildren.push(
        h('div', { key: 'actions', className: 'btn-row' }, item.actions.map(function toAction(action, idx) {
          return actionNode(action, idx, item, props.onAction);
        }))
      );
    }

    if (item.extraHtml) {
      contentChildren.push(
        h('div', {
          key: 'extra-html',
          dangerouslySetInnerHTML: { __html: item.extraHtml }
        })
      );
    }

    if (typeof item.renderBody === 'function') {
      contentChildren.push(
        h('div', { key: 'render-body' }, item.renderBody({ item, onAction: props.onAction, React: ReactRef, h }))
      );
    }

    return h(
      'div',
      cardProps,
      h(
        'div',
        { className: 'app-head' },
        h('div', { className: 'app-title' }, item.title || ''),
        item.eyebrow ? h('div', { className: 'muted' }, item.eyebrow) : null
      ),
      ...contentChildren,
      props.children || null
    );
  }

  function CardsGrid(props) {
    const className = props.className || '';
    return h(
      'div',
      { className },
      (props.items || []).map(function toCard(item, index) {
        return h(StickyCard, {
          key: item.id || item.slug || item.title || index,
          item,
          index,
          type: props.type,
          onAction: props.onAction,
          cardClickable: props.cardClickable
        });
      })
    );
  }

  function renderRoleCards(mountNode, items) {
    if (!mountNode) return;
    const root = rootsByNode.get(mountNode) || ReactDOMRef.createRoot(mountNode);
    rootsByNode.set(mountNode, root);
    root.render(h(CardsGrid, { className: 'roles postit-grid', items, type: 'role', cardClickable: true }));
    return root;
  }

  function renderAppCards(mountNode, items, onAction) {
    if (!mountNode) return;
    const root = rootsByNode.get(mountNode) || ReactDOMRef.createRoot(mountNode);
    rootsByNode.set(mountNode, root);
    root.render(h(CardsGrid, { className: 'apps postit-grid', items, type: 'app', onAction }));
    return root;
  }

  function renderReactNode(mountNode, node) {
    if (!mountNode) return;
    const root = rootsByNode.get(mountNode) || ReactDOMRef.createRoot(mountNode);
    rootsByNode.set(mountNode, root);
    root.render(node);
    return root;
  }

  global.PostitCards = {
    renderRoleCards,
    renderAppCards,
    renderReactNode,
    React: ReactRef,
    h,
    Components: {
      StickyCard,
      RoleNote: function RoleNote(props) {
        return h(StickyCard, { ...props, type: 'role' }, props.children || null);
      },
      AppNote: function AppNote(props) {
        return h(StickyCard, { ...props, type: 'app', cardClickable: props.cardClickable, onAction: props.onAction }, props.children || null);
      },
      CardsGrid
    }
  };
})(window);
