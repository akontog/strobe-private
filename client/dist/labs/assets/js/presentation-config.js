(function initializePresentationConfig() {
  if (window.SharedPresentationConfig) {
    return;
  }

  const STORAGE_PREFIX = "strobe:presentation-config:";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDeep(base, override) {
    const result = Array.isArray(base) ? [...base] : { ...base };
    Object.keys(override || {}).forEach((key) => {
      const baseValue = result[key];
      const overrideValue = override[key];
      if (
        baseValue
        && overrideValue
        && typeof baseValue === "object"
        && typeof overrideValue === "object"
        && !Array.isArray(baseValue)
        && !Array.isArray(overrideValue)
      ) {
        result[key] = mergeDeep(baseValue, overrideValue);
      } else {
        result[key] = overrideValue;
      }
    });
    return result;
  }

  function getStorageKey(slug) {
    return `${STORAGE_PREFIX}${slug}`;
  }

  function getAppConfig(slug, defaults = {}) {
    try {
      const raw = window.localStorage.getItem(getStorageKey(slug));
      if (!raw) {
        return clone(defaults);
      }
      const parsed = JSON.parse(raw);
      return mergeDeep(clone(defaults), parsed);
    } catch (error) {
      return clone(defaults);
    }
  }

  function saveAppConfig(slug, config) {
    window.localStorage.setItem(getStorageKey(slug), JSON.stringify(config));
    return config;
  }

  function applyVisibilityByDataAttribute(root, visibility = {}, attributeName) {
    if (!root || !attributeName) {
      return;
    }

    const nodes = Array.from(root.querySelectorAll(`[${attributeName}]`));
    nodes.forEach((node) => {
      const key = node.getAttribute(attributeName) || "";
      const isVisible = visibility[key] !== false;
      node.style.display = isVisible ? "" : "none";
    });
  }

  function applyAccordionVisibility(root, accordionVisibility = {}) {
    applyVisibilityByDataAttribute(root, accordionVisibility, "data-accordion-group");
  }

  function applyClassroomPanelVisibility(root, panelVisibility = {}) {
    applyVisibilityByDataAttribute(root, panelVisibility, "data-classroom-panel");
  }

  window.SharedPresentationConfig = {
    getAppConfig,
    saveAppConfig,
    applyAccordionVisibility,
    applyClassroomPanelVisibility,
  };
})();
