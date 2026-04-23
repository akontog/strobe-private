(function initializePresentationShell() {
  if (window.SharedPresentationDeck && window.SharedPresentationUi) {
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

  function resolveElements(value) {
    if (!value) {
      return [];
    }

    if (typeof value === "string") {
      return Array.from(document.querySelectorAll(value));
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value.length === "number") {
      return Array.from(value).filter(Boolean);
    }

    return [value].filter(Boolean);
  }

  function emitDocumentEvent(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  function initDeck(config = {}) {
    const slides = resolveElements(config.slides || config.slideSelector || ".section");
    const links = resolveElements(config.links || config.linkSelector || ".sidebar a[href^='#']");
    const contentEl = resolveElement(config.contentEl || config.contentSelector || "#content");
    const prevButtonEl = resolveElement(config.prevButtonEl || config.prevButtonSelector || "#prevSlideBtn");
    const nextButtonEl = resolveElement(config.nextButtonEl || config.nextButtonSelector || "#nextSlideBtn");
    const menuButtonEl = resolveElement(config.menuButtonEl || config.menuButtonSelector);
    const sidebarEl = resolveElement(config.sidebarEl || config.sidebarSelector);

    const readyEventName = config.readyEventName || "fourier:deck-ready";
    const slideChangedEventName = config.slideChangedEventName || "fourier:slide-changed";
    const sidebarMobileBreakpoint = Number.isFinite(config.sidebarMobileBreakpoint)
      ? config.sidebarMobileBreakpoint
      : 900;
    const observerMinRatio = typeof config.observerMinRatio === "number"
      ? config.observerMinRatio
      : 0.55;
    const observerThresholds = Array.isArray(config.observerThresholds)
      ? config.observerThresholds
      : [0.55, 0.7];
    const exposeNames = [config.exposeAs, ...(config.aliases || [])].filter(Boolean);

    let currentSlideIndex = Math.max(0, Math.min(slides.length - 1, config.initialIndex || 0));
    let navigationLocked = Boolean(config.initialNavigationLocked);
    let navigationSettleTimer = null;
    let ignoreObserverUntil = 0;
    let pendingNavigationIndex = -1;
    let lastSlideBroadcast = { index: -1, source: "" };

    function getSlideIdFromLink(link) {
      const href = link && link.getAttribute ? link.getAttribute("href") || "" : "";
      return href.startsWith("#") ? href.slice(1) : "";
    }

    function defaultSetActiveLink(index, slide) {
      const slideId = slide && slide.id ? slide.id : "";
      links.forEach((link) => {
        link.classList.toggle("active", getSlideIdFromLink(link) === slideId);
      });
    }

    const setActiveLink = typeof config.setActiveLink === "function"
      ? config.setActiveLink
      : defaultSetActiveLink;

    function refreshNavButtons() {
      if (prevButtonEl) {
        prevButtonEl.disabled = navigationLocked || currentSlideIndex === 0;
      }

      if (nextButtonEl) {
        nextButtonEl.disabled = navigationLocked || currentSlideIndex === slides.length - 1;
      }

      if (typeof config.onRefreshNavButtons === "function") {
        config.onRefreshNavButtons({ currentSlideIndex, navigationLocked, slides });
      }
    }

    function emitSlideChanged(source = "local") {
      const slide = slides[currentSlideIndex];
      if (!slide) {
        return;
      }

      if (config.dedupeSlideChanged !== false
        && lastSlideBroadcast.index === currentSlideIndex
        && lastSlideBroadcast.source === source) {
        return;
      }

      lastSlideBroadcast = { index: currentSlideIndex, source };
      emitDocumentEvent(slideChangedEventName, {
        index: currentSlideIndex,
        slideId: slide.id || "",
        source,
      });
    }

    function beginProgrammaticNavigation(targetIndex, smooth) {
      pendingNavigationIndex = targetIndex;
      ignoreObserverUntil = performance.now() + (smooth ? 700 : 120);

      if (navigationSettleTimer) {
        clearTimeout(navigationSettleTimer);
      }

      navigationSettleTimer = window.setTimeout(() => {
        pendingNavigationIndex = -1;
        navigationSettleTimer = null;
      }, smooth ? 720 : 140);
    }

    function goToSlide(index, options = {}) {
      if (!slides.length) {
        return false;
      }

      const boundedIndex = Math.max(0, Math.min(slides.length - 1, index));
      const source = options.source || "local";
      const force = Boolean(options.force);
      const smooth = options.smooth !== false;

      if (navigationLocked && !force && source !== "remote") {
        return false;
      }

      if (!force && boundedIndex === currentSlideIndex && pendingNavigationIndex !== -1) {
        return true;
      }

      currentSlideIndex = boundedIndex;
      beginProgrammaticNavigation(boundedIndex, smooth);

      if (contentEl && typeof contentEl.scrollTo === "function") {
        contentEl.scrollTo({
          top: slides[boundedIndex].offsetTop,
          behavior: smooth ? "smooth" : "auto",
        });
      } else {
        slides[boundedIndex].scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      }

      refreshNavButtons();
      setActiveLink(boundedIndex, slides[boundedIndex], { shouldScrollIntoView: true, source });
      emitSlideChanged(source);
      return true;
    }

    function applyNavigationLockEffects() {
      if (contentEl) {
        contentEl.style.overflowY = navigationLocked ? "hidden" : "auto";
      }
    }

    function getSlideIndexForLink(link) {
      const slideId = getSlideIdFromLink(link);
      if (!slideId) {
        return -1;
      }

      return slides.findIndex((slide) => slide.id === slideId);
    }

    function setSidebarOpen(forceOpen = null) {
      if (!sidebarEl) {
        return false;
      }

      const mobile = window.innerWidth <= sidebarMobileBreakpoint;
      const currentOpen = mobile
        ? sidebarEl.classList.contains("open")
        : !sidebarEl.classList.contains("hidden");
      const shouldOpen = forceOpen === null ? !currentOpen : Boolean(forceOpen);

      if (mobile) {
        sidebarEl.classList.toggle("open", shouldOpen);
        sidebarEl.classList.toggle("hidden", !shouldOpen);
      } else {
        sidebarEl.classList.toggle("hidden", !shouldOpen);
        sidebarEl.classList.remove("open");
      }

      if (menuButtonEl) {
        menuButtonEl.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      }

      return shouldOpen;
    }

    const homeButtonEl = resolveElement(config.homeButtonEl || config.homeButtonSelector);

    // Initialize home button visibility based on initial sidebar state
    if (homeButtonEl && sidebarEl) {
      const isSidebarOpen = sidebarEl.classList.contains("open") || 
                           !sidebarEl.classList.contains("hidden");
      homeButtonEl.classList.toggle("visible", isSidebarOpen);
    }

    if (config.menuButtonTogglesSidebar && menuButtonEl && sidebarEl) {
      menuButtonEl.addEventListener("click", () => {
        const isSidebarOpenBefore = sidebarEl.classList.contains("open") || 
                                   !sidebarEl.classList.contains("hidden");
        setSidebarOpen(null);
        
        // Update home button to match new sidebar state
        if (homeButtonEl) {
          const isSidebarOpenAfter = sidebarEl.classList.contains("open") || 
                                    !sidebarEl.classList.contains("hidden");
          homeButtonEl.classList.toggle("visible", isSidebarOpenAfter);
        }
      });
    }

    if (homeButtonEl) {
      homeButtonEl.addEventListener("click", () => {
        window.location.href = "/teacher";
      });
    }

    if (prevButtonEl) {
      prevButtonEl.addEventListener("click", () => goToSlide(currentSlideIndex - 1));
    }

    if (nextButtonEl) {
      nextButtonEl.addEventListener("click", () => goToSlide(currentSlideIndex + 1));
    }

    if (config.enableKeyboardNavigation !== false) {
      document.addEventListener("keydown", (event) => {
        const target = event.target;
        const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (tagName === "input" || tagName === "textarea" || (target && target.isContentEditable)) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToSlide(currentSlideIndex - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goToSlide(currentSlideIndex + 1);
        }
      });
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetIndex = getSlideIndexForLink(link);
        if (targetIndex < 0) {
          return;
        }

        event.preventDefault();
        goToSlide(targetIndex);

        if (typeof config.onLinkNavigate === "function") {
          config.onLinkNavigate({ link, index: targetIndex, slide: slides[targetIndex] });
        }
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < ignoreObserverUntil) {
          return;
        }

        let bestEntry = null;

        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio <= observerMinRatio) {
            return;
          }

          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        });

        if (!bestEntry) {
          return;
        }

        const idx = slides.indexOf(bestEntry.target);
        if (idx < 0 || idx === currentSlideIndex) {
          return;
        }

        pendingNavigationIndex = -1;
        currentSlideIndex = idx;
        refreshNavButtons();
        setActiveLink(idx, slides[idx], { shouldScrollIntoView: true, source: "scroll" });
        emitSlideChanged("scroll");
      },
      {
        root: contentEl,
        threshold: observerThresholds,
      }
    );

    slides.forEach((slide) => observer.observe(slide));
    applyNavigationLockEffects();
    refreshNavButtons();
    if (slides[currentSlideIndex]) {
      setActiveLink(currentSlideIndex, slides[currentSlideIndex], { shouldScrollIntoView: false, source: "init" });
    }

    const api = {
      getSlides() {
        return slides.map((slide, index) => ({ index, id: slide.id || "" }));
      },
      getCurrentSlideIndex() {
        return currentSlideIndex;
      },
      getCurrentSlideId() {
        return slides[currentSlideIndex] ? slides[currentSlideIndex].id || "" : "";
      },
      goToSlide(index, options = {}) {
        return goToSlide(index, options);
      },
      goToSlideById(slideId, options = {}) {
        const targetIndex = slides.findIndex((slide) => slide.id === slideId);
        if (targetIndex < 0) {
          return false;
        }

        return goToSlide(targetIndex, options);
      },
      setNavigationLocked(locked) {
        navigationLocked = Boolean(locked);
        applyNavigationLockEffects();
        refreshNavButtons();
      },
      isNavigationLocked() {
        return navigationLocked;
      },
      refreshNavButtons,
      setSidebarOpen,
    };

    exposeNames.forEach((name) => {
      window[name] = api;
    });

    emitDocumentEvent(readyEventName, {
      currentSlideIndex,
      currentSlideId: slides[currentSlideIndex] ? slides[currentSlideIndex].id || "" : "",
    });
    emitSlideChanged("init");

    return api;
  }

  function initAccordions(config = {}) {
    const buttons = resolveElements(config.buttons || config.buttonSelector || "[data-class-accordion-toggle]");

    function setOpen(button, forceOpen = null) {
      const targetId = String(button && button.dataset ? button.dataset.target || "" : "").trim();
      const target = targetId ? document.getElementById(targetId) : null;
      const arrow = button ? button.querySelector(".class-accordion-arrow") : null;

      if (!target) {
        return false;
      }

      const shouldOpen = forceOpen === null
        ? !target.classList.contains("open")
        : Boolean(forceOpen);

      target.classList.toggle("open", shouldOpen);
      if (arrow) {
        arrow.classList.toggle("open", shouldOpen);
      }
      button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      return shouldOpen;
    }

    buttons.forEach((button) => {
      setOpen(button, button.getAttribute("aria-expanded") !== "false");
      button.addEventListener("click", () => {
        setOpen(button, null);
      });
    });

    return { buttons, setOpen };
  }

  function initDock(config = {}) {
    const dockEl = resolveElement(config.dockEl || config.dockSelector || "#classroomDock");
    const menuButtonEl = resolveElement(config.menuButtonEl || config.menuButtonSelector || "#menuBtn");
    const contentEl = resolveElement(config.contentEl || config.contentSelector || "#content");
    const prevButtonEl = resolveElement(config.prevButtonEl || config.prevButtonSelector || "#prevSlideBtn");
    const mobileBreakpoint = Number.isFinite(config.mobileBreakpoint) ? config.mobileBreakpoint : 900;
    const shiftVariableName = config.shiftVariableName || "--classroom-content-shift";
    const toggleEventName = config.toggleEventName || "fourier:classroom-dock-toggle";

    let shiftPx = 0;

    function updateLayoutShift() {
      if (!dockEl || !contentEl) {
        shiftPx = 0;
        document.documentElement.style.setProperty(shiftVariableName, "0px");
        return;
      }

      const isDockOpen = dockEl.classList.contains("open");
      if (!isDockOpen || window.innerWidth <= mobileBreakpoint) {
        shiftPx = 0;
      } else {
        const dockWidth = Math.max(0, dockEl.getBoundingClientRect().width || 0);
        const maxShift = Math.max(0, window.innerWidth - 320);
        shiftPx = Math.round(Math.min(dockWidth, maxShift));
      }

      document.documentElement.style.setProperty(shiftVariableName, `${shiftPx}px`);
      contentEl.classList.toggle("sidebar-open-shift", shiftPx > 0);
    }

    function updateEdgeNavPosition() {
      if (!prevButtonEl) {
        return;
      }

      if (window.innerWidth <= mobileBreakpoint) {
        prevButtonEl.style.left = "10px";
        return;
      }

      prevButtonEl.style.left = `${Math.max(14, 14 + shiftPx)}px`;
    }

    function emitState(open) {
      emitDocumentEvent(toggleEventName, { open });
    }

    function setOpen(forceOpen = null) {
      if (!dockEl) {
        return false;
      }

      const shouldOpen = forceOpen === null
        ? !dockEl.classList.contains("open")
        : Boolean(forceOpen);

      dockEl.classList.toggle("open", shouldOpen);
      if (menuButtonEl) {
        menuButtonEl.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        menuButtonEl.setAttribute("aria-label", shouldOpen ? "Κλείσιμο classroom panel" : "Άνοιγμα classroom panel");
      }

      updateLayoutShift();
      updateEdgeNavPosition();
      emitState(shouldOpen);
      return shouldOpen;
    }

    if (dockEl && menuButtonEl) {
      menuButtonEl.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(null);
      });

      document.addEventListener("click", (event) => {
        if (!dockEl.classList.contains("open")) {
          return;
        }

        const target = event.target;
        if (dockEl.contains(target) || menuButtonEl.contains(target)) {
          return;
        }

        setOpen(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      });
    }

    window.addEventListener("resize", () => {
      updateLayoutShift();
      updateEdgeNavPosition();
    });

    emitState(Boolean(dockEl && dockEl.classList.contains("open")));
    updateLayoutShift();
    updateEdgeNavPosition();

    return {
      setOpen,
      updateLayoutShift,
      updateEdgeNavPosition,
      getShiftPx() {
        return shiftPx;
      },
    };
  }

  window.SharedPresentationDeck = { init: initDeck };
  window.SharedPresentationUi = {
    initAccordions,
    initDock,
  };
})();