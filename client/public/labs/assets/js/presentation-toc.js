(function initializeSharedToc() {
  if (window.SharedPresentationToc) {
    return;
  }

  function resolveElement(value) {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      return document.querySelector(value);
    }

    return value;
  }

  function initGroupAccordions(config = {}) {
    const root = resolveElement(config.root || config.rootSelector || ".sidebar");
    if (!root) {
      return { titles: [], toggleGroup() { return false; } };
    }

    const titleSelector = config.titleSelector || ".toc-group-title";
    const titles = Array.from(root.querySelectorAll(titleSelector));

    function collectGroupItems(titleEl) {
      const items = [];
      let cursor = titleEl.nextElementSibling;
      while (cursor && !cursor.matches(titleSelector)) {
        if (cursor.matches("a[href^='#']")) {
          items.push(cursor);
        }
        cursor = cursor.nextElementSibling;
      }
      return items;
    }

    function toggleGroup(titleEl, forceOpen = null) {
      const groupItems = collectGroupItems(titleEl);
      if (!groupItems.length) {
        return false;
      }

      const currentlyOpen = !titleEl.classList.contains("collapsed");
      const shouldOpen = forceOpen === null ? !currentlyOpen : Boolean(forceOpen);

      titleEl.classList.toggle("collapsed", !shouldOpen);
      groupItems.forEach((item) => {
        item.style.display = shouldOpen ? "" : "none";
      });

      return shouldOpen;
    }

    titles.forEach((titleEl) => {
      toggleGroup(titleEl, titleEl.classList.contains("collapsed") ? false : true);
      titleEl.addEventListener("click", () => {
        toggleGroup(titleEl, null);
      });
    });

    return { titles, toggleGroup };
  }

  window.SharedPresentationToc = {
    initGroupAccordions,
  };
})();
