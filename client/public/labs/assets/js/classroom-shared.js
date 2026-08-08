(function initSharedClassroomDock(global) {
  if (global.SharedClassroomDock) {
    return;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (typeof text === "string") {
      el.textContent = text;
    }
    return el;
  }

  function create(options) {
    const config = options && typeof options === "object" ? options : {};
    const appTitle = String(config.appTitle || "Classroom");
    const role = String(config.role || "participant");

    const toggleBtn = makeEl("button", "classroom-shared-toggle");
    toggleBtn.type = "button";
    toggleBtn.setAttribute("aria-label", "Άνοιγμα classroom dock");
    toggleBtn.innerHTML = '☰ Classroom <span class="classroom-shared-badge">0</span>';

    const dock = makeEl("aside", "classroom-shared-dock");
    const head = makeEl("div", "classroom-shared-head");
    const title = makeEl("h3", "classroom-shared-title", appTitle);
    const sub = makeEl("p", "classroom-shared-sub", role);
    const status = makeEl("p", "classroom-shared-status", "Offline");
    const statusDot = makeEl("span", "classroom-shared-status-dot");
    status.prepend(statusDot);
    head.append(title, sub, status);

    const tabs = makeEl("div", "classroom-shared-tabs");
    const usersTab = makeEl("button", "classroom-shared-tab active", "Χρήστες");
    usersTab.type = "button";
    const chatTab = makeEl("button", "classroom-shared-tab", "Chat");
    chatTab.type = "button";
    tabs.append(usersTab, chatTab);

    const body = makeEl("div", "classroom-shared-body");
    const usersPane = makeEl("section", "classroom-shared-pane active");
    const usersList = makeEl("ul", "classroom-shared-list");
    const usersEmpty = makeEl("div", "classroom-shared-empty", "Δεν υπάρχουν ακόμα χρήστες.");
    usersPane.append(usersEmpty, usersList);

    const chatPane = makeEl("section", "classroom-shared-pane");
    const chatFeed = makeEl("div", "classroom-shared-chat-feed");
    chatFeed.innerHTML = '<div class="classroom-shared-empty">Το chat θα λειτουργεί όταν το app δώσει event handler.</div>';
    const chatForm = makeEl("div", "classroom-shared-chat-form");
    const chatInput = makeEl("input", "classroom-shared-chat-input");
    chatInput.type = "text";
    chatInput.placeholder = "Μήνυμα...";
    const chatSend = makeEl("button", "classroom-shared-chat-send", "Αποστολή");
    chatSend.type = "button";
    chatForm.append(chatInput, chatSend);
    chatPane.append(chatFeed, chatForm);

    body.append(usersPane, chatPane);
    dock.append(head, tabs, body);

    document.body.append(toggleBtn, dock);

    const badge = toggleBtn.querySelector(".classroom-shared-badge");
    let participants = [];
    let chatMessages = [];

    function setTab(tabKey) {
      const usersActive = tabKey === "users";
      usersTab.classList.toggle("active", usersActive);
      chatTab.classList.toggle("active", !usersActive);
      usersPane.classList.toggle("active", usersActive);
      chatPane.classList.toggle("active", !usersActive);
    }

    function renderUsers() {
      usersList.innerHTML = "";
      const count = participants.length;
      badge.textContent = String(count);
      usersEmpty.style.display = count ? "none" : "block";

      participants.forEach((participant) => {
        const item = makeEl("li", "classroom-shared-user");
        const left = makeEl("span", "classroom-shared-user-name", participant.name || "Unknown");
        const right = makeEl("span", "classroom-shared-user-role", participant.role || "client");
        item.append(left, right);
        usersList.appendChild(item);
      });
    }

    function renderChat() {
      if (!chatMessages.length) {
        chatFeed.innerHTML = '<div class="classroom-shared-empty">Δεν υπάρχουν μηνύματα.</div>';
        return;
      }

      chatFeed.innerHTML = chatMessages.map((entry) => {
        const name = escapeHtml(entry.name || "User");
        const roleLabel = escapeHtml(entry.role || "participant");
        const text = escapeHtml(entry.text || "");
        return `<div class="classroom-shared-chat-item"><div class="classroom-shared-chat-meta">${name} • ${roleLabel}</div><div class="classroom-shared-chat-text">${text}</div></div>`;
      }).join("");
      chatFeed.scrollTop = chatFeed.scrollHeight;
    }

    usersTab.addEventListener("click", function onUsersTab() {
      setTab("users");
    });

    chatTab.addEventListener("click", function onChatTab() {
      setTab("chat");
    });

    toggleBtn.addEventListener("click", function onToggle() {
      dock.classList.toggle("open");
      if (dock.classList.contains("open")) {
        setTab("users");
      }
    });

    chatSend.addEventListener("click", function onSendChat() {
      const text = String(chatInput.value || "").trim();
      if (!text) {
        return;
      }

      if (typeof config.onChatSend === "function") {
        config.onChatSend(text);
      }

      chatInput.value = "";
    });

    chatInput.addEventListener("keydown", function onChatKey(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        chatSend.click();
      }
    });

    renderUsers();
    renderChat();

    return {
      setConnection: function setConnection(payload) {
        const connected = Boolean(payload && payload.connected);
        const text = payload && payload.text ? String(payload.text) : (connected ? "Online" : "Offline");
        status.classList.toggle("connected", connected);
        status.lastChild.textContent = text;
      },
      setParticipants: function setParticipants(list) {
        participants = Array.isArray(list) ? list : [];
        renderUsers();
      },
      setChatMessages: function setChatMessages(list) {
        chatMessages = Array.isArray(list) ? list : [];
        renderChat();
      },
      addChatMessage: function addChatMessage(entry) {
        chatMessages = [...chatMessages.slice(-119), entry];
        renderChat();
      },
      open: function open() {
        dock.classList.add("open");
      },
      close: function close() {
        dock.classList.remove("open");
      }
    };
  }

  global.SharedClassroomDock = {
    create
  };
})(window);
