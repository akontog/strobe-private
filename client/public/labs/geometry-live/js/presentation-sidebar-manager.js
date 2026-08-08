/**
 * Shared Sidebar Management for Presentation Apps
 * Handles sidebar toggling and home button visibility
 */

(function initializePresentationSidebarManager() {
  if (window.PresentationSidebarManager) {
    return; // Already initialized
  }

  const PresentationSidebarManager = {
    /**
     * Initialize sidebar management for a presentation app
     * @param {Object} config - Configuration object
     * @param {string|HTMLElement} config.sidebarSelector - Sidebar element or selector
     * @param {string|HTMLElement} config.menuButtonSelector - Menu button element or selector
     * @param {string|HTMLElement} config.homeButtonSelector - Home button element or selector
     * @param {number} config.mobileBreakpoint - Breakpoint for mobile view (default: 900px)
     */
    init(config = {}) {
      const sidebarEl = typeof config.sidebarSelector === 'string' 
        ? document.querySelector(config.sidebarSelector)
        : config.sidebarSelector;

      const menuButtonEl = typeof config.menuButtonSelector === 'string'
        ? document.querySelector(config.menuButtonSelector)
        : config.menuButtonSelector;

      const homeButtonEl = typeof config.homeButtonSelector === 'string'
        ? document.querySelector(config.homeButtonSelector)
        : config.homeButtonSelector;

      const mobileBreakpoint = config.mobileBreakpoint || 900;

      if (!sidebarEl || !menuButtonEl) {
        console.warn('PresentationSidebarManager: Missing sidebar or menu button');
        return;
      }

      /**
       * Update home button visibility based on sidebar open state
       */
      const updateHomeButtonVisibility = () => {
        if (!homeButtonEl) return;

        const isMobile = window.innerWidth <= mobileBreakpoint;
        const isSidebarOpen = isMobile 
          ? sidebarEl.classList.contains('open')
          : !sidebarEl.classList.contains('hidden');

        // Home button visible only when sidebar is open
        homeButtonEl.classList.toggle('visible', isSidebarOpen);
      };

      /**
       * Toggle sidebar visibility
       */
      const toggleSidebar = () => {
        const isMobile = window.innerWidth <= mobileBreakpoint;
        
        if (isMobile) {
          sidebarEl.classList.toggle('open');
        } else {
          sidebarEl.classList.toggle('hidden');
        }

        // Update home button visibility
        updateHomeButtonVisibility();

        // Update menu button aria-expanded
        if (menuButtonEl) {
          const isSidebarOpen = sidebarEl.classList.contains('open') || 
                               !sidebarEl.classList.contains('hidden');
          menuButtonEl.setAttribute('aria-expanded', isSidebarOpen ? 'true' : 'false');
        }
      };

      // Initialize home button visibility on load
      updateHomeButtonVisibility();

      // Setup menu button click handler
      menuButtonEl.addEventListener('click', toggleSidebar);

      // Setup home button click handler (if exists)
      if (homeButtonEl) {
        homeButtonEl.addEventListener('click', () => {
          window.location.href = '/teacher';
        });
      }

      // Handle window resize to update sidebar state on breakpoint change
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateHomeButtonVisibility, 250);
      });

      // Return API for external control if needed
      return {
        toggleSidebar,
        updateHomeButtonVisibility,
        isSidebarOpen: () => {
          const isMobile = window.innerWidth <= mobileBreakpoint;
          return isMobile 
            ? sidebarEl.classList.contains('open')
            : !sidebarEl.classList.contains('hidden');
        }
      };
    }
  };

  window.PresentationSidebarManager = PresentationSidebarManager;
})();
