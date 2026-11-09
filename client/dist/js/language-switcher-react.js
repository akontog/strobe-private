(function () {
  const STORAGE_KEY = 'preferredLanguage';
  const OPTIONS = [
    { code: 'el', icon: '🇬🇷', label: 'Ελληνικά' },
    { code: 'en', icon: '🇬🇧', label: 'English' }
  ];

  function readLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'el';
    } catch {
      return 'el';
    }
  }

  function updateDocumentLanguage(language) {
    document.documentElement.lang = language;
  }

  function updateButtons(language) {
    document.querySelectorAll('[data-strobe-language-button]').forEach((button) => {
      const isActive = button.getAttribute('data-language') === language;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function setLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore storage failures
    }

    updateDocumentLanguage(language);

    if (window.StrobeI18n && typeof window.StrobeI18n.changeLanguage === 'function') {
      window.StrobeI18n.changeLanguage(language);
    }

    window.dispatchEvent(new CustomEvent('strobe-language-changed', { detail: { language } }));
    updateButtons(language);
  }

  function ensureStyles() {
    if (document.getElementById('strobe-language-switcher-style')) return;

    const style = document.createElement('style');
    style.id = 'strobe-language-switcher-style';
    style.textContent = `
      #strobe-language-switcher-root {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
      }

      .strobe-language-switcher {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #10233f;
        border: 1px solid rgba(16, 35, 63, 0.12);
        box-shadow: 0 16px 32px rgba(16, 35, 63, 0.18);
        backdrop-filter: blur(12px);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 14px;
      }

      .strobe-language-label {
        font-weight: 700;
        padding-right: 4px;
        white-space: nowrap;
      }

      .strobe-language-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        border-radius: 999px;
        padding: 8px 10px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .strobe-language-button.active {
        background: #1d4ed8;
        color: white;
      }

      .strobe-language-button:hover {
        background: rgba(29, 78, 216, 0.12);
      }
    `;
    document.head.appendChild(style);
  }

  function mount() {
    if (document.getElementById('strobe-language-switcher-root')) return;

    ensureStyles();

    const mountNode = document.createElement('div');
    mountNode.id = 'strobe-language-switcher-root';

    const shell = document.createElement('div');
    shell.className = 'strobe-language-switcher';
    shell.setAttribute('role', 'group');
    shell.setAttribute('aria-label', 'Language switcher');

    const label = document.createElement('span');
    label.className = 'strobe-language-label';
    label.textContent = '🌍 Language';
    shell.appendChild(label);

    OPTIONS.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'strobe-language-button';
      button.setAttribute('data-strobe-language-button', 'true');
      button.setAttribute('data-language', option.code);
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span class="strobe-language-icon">${option.icon}</span><span>${option.label}</span>`;
      button.addEventListener('click', () => setLanguage(option.code));
      shell.appendChild(button);
    });

    mountNode.appendChild(shell);
    document.body.appendChild(mountNode);

    const initialLanguage = readLanguage();
    updateDocumentLanguage(initialLanguage);
    updateButtons(initialLanguage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
