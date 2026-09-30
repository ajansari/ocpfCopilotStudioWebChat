(() => {
  "use strict";

  const state = {
    directLine: null,
    isOpen: false,
    greetingSent: false,
    seenActivityIds: new Set(),
    typingTimeout: null,
    subscriptions: [],
    pendingFiles: [],
    userId: `user-${Math.random().toString(36).slice(2, 10)}`,
    connected: false
  };

  const ui = {
    chatToggle: document.getElementById("chatToggle"),
    chatToggleLabel: document.getElementById("chatToggleLabel"),
    chatPanel: document.getElementById("chatPanel"),
    chatHeaderIcon: document.getElementById("chatHeaderIcon"),
    chatTitle: document.getElementById("chatTitle"),
    chatClose: document.getElementById("chatClose"),
    chatRestart: document.getElementById("chatRestart"),
    chatStatus: document.getElementById("chatStatus"),
    connectionDot: document.getElementById("connectionDot"),
    connectionText: document.getElementById("connectionText"),
    messages: document.getElementById("messages"),
    typingIndicator: document.getElementById("typingIndicator"),
    suggestedActions: document.getElementById("suggestedActions"),
    messageForm: document.getElementById("messageForm"),
    messageInput: document.getElementById("messageInput"),
    sendButton: document.getElementById("sendButton"),
    attachButton: document.getElementById("attachButton"),
    fileInput: document.getElementById("fileInput"),
    attachmentList: document.getElementById("attachmentList")
  };

  const config = window.ocpfConfig;

  // Launcher button text for closed/open states, by launcherStyle in config.js.
  // Closed-state text comes from launcherLabelFull / launcherLabelCompact in config.js.
  const text = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);
  const fullLabel = text(config?.launcherLabelFull, "Chat with ocpf");
  const compactLabel = text(config?.launcherLabelCompact, "Chat");
  const LAUNCHER_LABELS = {
    full: { closed: fullLabel, open: "Close chat" },
    compact: { closed: compactLabel, open: "Close" },
    icon: { closed: "", open: "" },
    fulltext: { closed: fullLabel, open: "Close chat" },       // no icon
    compacttext: { closed: compactLabel, open: "Close" }       // no icon
  };

  // Copilot Studio's per-file upload limit.
  const MAX_FILE_BYTES = 15 * 1024 * 1024;


  applyLauncherAppearance(config);
  applyFeatureToggles(config);

  if (!config?.directLine?.primarySecret) {
    setStatus("Direct Line primary secret is missing in config.js", true);
    return;
  }

  initializeUI();
  initializeChat().catch((error) => {
    console.error("[ocpf] Initialization error:", error);
    setStatus("Could not initialize chat. Check config and network connectivity.", true);
  });

  function initializeUI() {
    // Sync JS state from DOM in case host pages render the panel open by default.
    state.isOpen = !ui.chatPanel.hidden;
    setPanelOpen(state.isOpen);

    ui.chatToggle.addEventListener("click", () => {
      const shouldOpen = ui.chatPanel.hidden;
      setPanelOpen(shouldOpen);
    });

    ui.chatClose.addEventListener("click", () => setPanelOpen(false));
    ui.chatRestart?.addEventListener("click", () => restartChat());

    ui.messageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage(ui.messageInput.value);
      ui.messageInput.value = "";
      ui.messageInput.focus();
    });

    ui.attachButton?.addEventListener("click", () => ui.fileInput?.click());
    ui.fileInput?.addEventListener("change", () => {
      addPendingFiles(Array.from(ui.fileInput.files || []));
      ui.fileInput.value = "";
      ui.messageInput.focus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !ui.chatPanel.hidden) {
        setPanelOpen(false);
      }
    });
  }

  async function initializeChat() {
    setStatus("Connecting to ocpf...");

    const token = await getDirectLineTokenWithFallback();

    state.directLine = new DirectLine.DirectLine({
      token,
      domain: config.directLine.domain,
      webSocket: true
    });

    subscribeConnectionStatus();
    subscribeActivities();
  }

  // Ends the current Direct Line conversation, clears the transcript, and opens a new one.
  function restartChat() {
    if (ui.chatRestart.disabled) return;
    ui.chatRestart.disabled = true;

    state.subscriptions.forEach((sub) => sub.unsubscribe());
    state.subscriptions = [];
    state.directLine?.end();
    state.directLine = null;
    updateConnection(false, "Connecting...");

    state.greetingSent = false;
    state.seenActivityIds.clear();
    hideTyping();
    toggleInput(false);
    clearPendingFiles();
    ui.suggestedActions.innerHTML = "";
    ui.messages.querySelectorAll(".message").forEach((node) => node.remove());

    initializeChat()
      .catch((error) => {
        console.error("[ocpf] Restart error:", error);
        setStatus("Could not start a new chat. Check config and network connectivity.", true);
      })
      .finally(() => {
        ui.chatRestart.disabled = false;
      });
  }

  async function getDirectLineTokenWithFallback() {
    const secrets = [
      config.directLine.primarySecret,
      config.directLine.secondarySecret
    ].filter(Boolean);

    let lastError = null;

    for (const [index, secret] of secrets.entries()) {
      try {
        const token = await requestDirectLineToken(secret);
        console.info(`[ocpf] Token acquired via secret ${index + 1}`);
        return token;
      } catch (error) {
        lastError = error;
        console.warn(`[ocpf] Secret ${index + 1} failed:`, error.message);
      }
    }

    throw new Error(`Token generation failed for all configured secrets. ${lastError?.message || ""}`);
  }

  async function requestDirectLineToken(secret) {
    const response = await fetch(config.directLine.tokenGenerationEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: {
          id: state.userId
        }
      })
    });

    if (!response.ok) {
      const details = await safeReadError(response);
      throw new Error(`Token request failed (${response.status}): ${details}`);
    }

    const payload = await response.json();

    if (!payload?.token) {
      throw new Error("Token response missing token field.");
    }

    return payload.token;
  }

  async function safeReadError(response) {
    try {
      const text = await response.text();
      return text || response.statusText;
    } catch {
      return response.statusText || "Unknown error";
    }
  }

  function subscribeConnectionStatus() {
    const sub = state.directLine.connectionStatus$.subscribe((status) => {
      switch (status) {
        case 0:
        case 1:
          updateConnection(false, "Connecting...");
          setStatus("Connecting to Direct Line...");
          toggleInput(false);
          break;
        case 2:
          updateConnection(true, "Online");
          clearStatus();
          toggleInput(true);
          triggerGreetingOnce();
          break;
        case 3:
          updateConnection(false, "Token expired");
          setStatus("Session expired. Refresh the page to reconnect.", true);
          toggleInput(false);
          break;
        case 4:
          updateConnection(false, "Connection failed");
          setStatus("Connection failed. Confirm secret/channel configuration and refresh.", true);
          toggleInput(false);
          break;
        case 5:
          updateConnection(false, "Conversation ended");
          setStatus("Conversation ended.");
          toggleInput(false);
          break;
        default:
          break;
      }
    });
    state.subscriptions.push(sub);
  }

  function subscribeActivities() {
    const sub = state.directLine.activity$
      .filter((activity) => {
        if (activity.from?.role !== "bot") return false;

        if (activity.id && state.seenActivityIds.has(activity.id)) {
          return false;
        }

        if (activity.id) {
          state.seenActivityIds.add(activity.id);
        }

        return true;
      })
      .subscribe((activity) => {
        if (activity.type === "typing") {
          showTyping();
          return;
        }

        if (activity.type !== "message") {
          return;
        }

        hideTyping();

        if (activity.text) {
          addAgentMessage(activity.text, activity.entities, activity);
        }

        if (activity.suggestedActions?.actions?.length) {
          renderSuggestedActions(activity.suggestedActions.actions);
        }
      });
    state.subscriptions.push(sub);
  }

  function triggerGreetingOnce() {
    if (state.greetingSent) return;

    state.greetingSent = true;

    state.directLine
      .postActivity({
        from: { id: state.userId },
        type: "event",
        name: "startConversation",
        locale: config.directLine.locale || navigator.language || "en-US"
      })
      .subscribe(
        () => console.info("[ocpf] Greeting event sent."),
        (error) => console.error("[ocpf] Greeting event error:", error)
      );
  }

  function sendMessage(rawText) {
    const text = (rawText || "").trim();
    const files = state.pendingFiles.slice();
    if ((!text && !files.length) || !state.connected || !state.directLine) {
      return;
    }

    addUserMessage(text, files);
    ui.suggestedActions.innerHTML = "";
    clearPendingFiles(false);

    const activity = {
      from: { id: state.userId },
      type: "message",
      text
    };

    // DirectLineJS downloads each contentUrl (blob: URLs included) and uploads the
    // files with the activity via Direct Line's multipart upload endpoint.
    if (files.length) {
      activity.attachments = files.map((entry) => ({
        contentType: entry.file.type || "application/octet-stream",
        contentUrl: entry.url,
        name: entry.file.name
      }));
    }

    state.directLine
      .postActivity(activity)
      .subscribe(
        (id) => {
          console.debug("[ocpf] Sent message", id);
          files.forEach((entry) => URL.revokeObjectURL(entry.url));
        },
        (error) => {
          console.error("[ocpf] Send error:", error);
          files.forEach((entry) => URL.revokeObjectURL(entry.url));
          setStatus(
            files.length ? "Message or file could not be sent. Please try again." : "Message could not be sent. Please try again.",
            true
          );
        }
      );
  }

  // ----- File attachments -----
  // Limits follow Copilot Studio's file-upload rules (15 MB per file; supported types are
  // set on the <input accept> in the HTML). File uploads must be turned on in the agent's
  // Settings > Generative AI > File uploads.
  function addPendingFiles(files) {
    files.forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        setStatus(`"${file.name}" is larger than 15 MB and was not attached.`, true);
        return;
      }
      state.pendingFiles.push({ file, url: URL.createObjectURL(file) });
    });
    renderPendingFiles();
  }

  function removePendingFile(entry) {
    URL.revokeObjectURL(entry.url);
    state.pendingFiles = state.pendingFiles.filter((item) => item !== entry);
    renderPendingFiles();
  }

  function clearPendingFiles(revoke = true) {
    if (revoke) state.pendingFiles.forEach((entry) => URL.revokeObjectURL(entry.url));
    state.pendingFiles = [];
    renderPendingFiles();
  }

  function renderPendingFiles() {
    if (!ui.attachmentList) return;
    ui.attachmentList.replaceChildren();
    state.pendingFiles.forEach((entry) => {
      const chip = document.createElement("span");
      chip.className = "attachment-chip";

      const name = document.createElement("span");
      name.className = "attachment-chip__name";
      name.textContent = entry.file.name;
      name.title = entry.file.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "attachment-chip__remove";
      remove.setAttribute("aria-label", `Remove ${entry.file.name}`);
      remove.textContent = "✕";
      remove.addEventListener("click", () => removePendingFile(entry));

      chip.append(name, remove);
      ui.attachmentList.appendChild(chip);
    });
    ui.attachmentList.classList.toggle("visible", state.pendingFiles.length > 0);
  }

  // ----- Feedback (thumbs up / down) -----
  // Copilot Studio marks messages that accept feedback with channelData.feedbackLoop, and
  // its own web chat answers with an invoke activity in the format below.
  function shouldShowFeedback(activity) {
    const mode = config.feedbackButtons || "auto";
    if (mode === "never") return false;
    if (mode === "always") return true;
    return Boolean(activity?.channelData?.feedbackLoop);
  }

  function sendFeedback(activity, reaction, feedbackText) {
    if (!state.directLine) return;

    state.directLine
      .postActivity({
        from: { id: state.userId },
        type: "invoke",
        name: "message/submitAction",
        replyToId: activity.id,
        value: {
          actionName: "feedback",
          actionValue: {
            reaction,
            feedback: JSON.stringify({ feedbackText: feedbackText || "" })
          }
        }
      })
      .subscribe(
        () => console.info(`[ocpf] Feedback sent: ${reaction}`),
        (error) => console.error("[ocpf] Feedback error:", error)
      );
  }

  function buildFeedbackControls(activity) {
    const wrap = document.createElement("div");
    wrap.className = "feedback";

    const bar = document.createElement("div");
    bar.className = "feedback__bar";

    const makeButton = (reaction, label, path) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `feedback__btn feedback__btn--${reaction}`;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      return button;
    };

    const thumbPath = '<path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l4.2-7.4a1.5 1.5 0 0 1 2.8.8V9h5a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 17.9 20H7"></path>';
    const likeButton = makeButton("like", "Good response", thumbPath);
    const dislikeButton = makeButton("dislike", "Bad response", thumbPath);
    bar.append(likeButton, dislikeButton);
    wrap.appendChild(bar);

    const form = document.createElement("form");
    form.className = "feedback__form";
    form.hidden = true;

    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    textarea.placeholder = "Add a comment (optional)";
    textarea.setAttribute("aria-label", "Feedback comment");

    const actions = document.createElement("div");
    actions.className = "feedback__actions";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Submit";

    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "feedback__skip";
    skip.textContent = "Skip";

    actions.append(skip, submit);
    form.append(textarea, actions);
    wrap.appendChild(form);

    let chosen = null;

    const finish = (comment) => {
      if (!chosen) return;
      sendFeedback(activity, chosen, comment);
      form.hidden = true;
      likeButton.disabled = true;
      dislikeButton.disabled = true;
      wrap.classList.add("feedback--done");
    };

    const choose = (reaction) => {
      chosen = reaction;
      likeButton.classList.toggle("is-selected", reaction === "like");
      dislikeButton.classList.toggle("is-selected", reaction === "dislike");
      form.hidden = false;
      textarea.focus();
      scrollMessagesToBottom();
    };

    likeButton.addEventListener("click", () => choose("like"));
    dislikeButton.addEventListener("click", () => choose("dislike"));
    skip.addEventListener("click", () => finish(""));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      finish(textarea.value.trim());
    });

    return wrap;
  }

  function launcherLabels() {
    return LAUNCHER_LABELS[config?.launcherStyle] || LAUNCHER_LABELS.full;
  }

  function applyFeatureToggles(cfg) {
    // Chat window title (header text). Falls back to the text already in the HTML.
    if (typeof cfg?.chatTitle === "string" && cfg.chatTitle.trim() && ui.chatTitle) {
      ui.chatTitle.textContent = cfg.chatTitle.trim();
      ui.chatPanel.setAttribute("aria-label", `${cfg.chatTitle.trim()} chat window`);
    }

    // Placeholder text in the message box. Falls back to the HTML placeholder.
    if (typeof cfg?.inputPlaceholder === "string" && cfg.inputPlaceholder.trim()) {
      ui.messageInput.placeholder = cfg.inputPlaceholder.trim();
    }

    // Optional markup: degrade quietly if a host page left these elements out.
    const uploads = cfg?.fileUploads !== false;
    if (ui.attachButton) {
      ui.attachButton.hidden = !uploads;
      if (ui.attachButton.nextElementSibling) ui.attachButton.nextElementSibling.hidden = !uploads; // divider
    }

    const style = LAUNCHER_LABELS[cfg?.launcherStyle] ? cfg.launcherStyle : "full";
    ui.chatToggle.classList.add(`chat-toggle--${style}`);
    ui.chatToggleLabel.textContent = LAUNCHER_LABELS[style].closed;
  }

  function setPanelOpen(open) {
    state.isOpen = open;

    ui.chatPanel.hidden = !open;
    ui.chatPanel.classList.toggle("is-open", open);
    ui.chatPanel.setAttribute("aria-hidden", String(!open));
    ui.chatToggle.setAttribute("aria-expanded", String(open));

    if (open) {
      ui.chatToggleLabel.textContent = launcherLabels().open;
      if (state.connected) {
        ui.messageInput.focus();
      }
      return;
    }

    ui.chatToggleLabel.textContent = launcherLabels().closed;
  }

  function updateConnection(isOnline, label) {
    state.connected = isOnline;
    ui.connectionText.textContent = label;
    ui.connectionDot.classList.toggle("online", isOnline);
  }

  function toggleInput(enabled) {
    ui.messageInput.disabled = !enabled;
    ui.sendButton.disabled = !enabled;
    if (ui.attachButton) ui.attachButton.disabled = !enabled;
  }

  // Applies launcher/header appearance from config.js:
  //   launcherIconUrl - image for the launcher button and chat header (built-in robot if unset/unloadable)
  //   launcherColor   - launcher button color (CSS color; default set in styles.css)
  function applyLauncherAppearance(cfg) {
    if (cfg?.launcherColor) {
      ui.chatToggle.style.setProperty("--launcher-color", cfg.launcherColor);
    }

    const root = document.documentElement.style;

    // fontSizeAdjust (px, e.g. +1 / -2) is added to every widget font size.
    if (Number.isFinite(cfg?.fontSizeAdjust)) {
      root.setProperty("--chat-font-adjust", `${cfg.fontSizeAdjust}px`);
    }

    // Offsets (px) move the launcher AND the chat window away from the corner.
    if (Number.isFinite(cfg?.launcherOffsetUp)) {
      root.setProperty("--launcher-offset-up", `${cfg.launcherOffsetUp}px`);
    }
    if (Number.isFinite(cfg?.launcherOffsetLeft)) {
      root.setProperty("--launcher-offset-left", `${cfg.launcherOffsetLeft}px`);
    }

    const holder = ui.chatToggle.querySelector(".chat-toggle__icon");
    const builtIn = holder?.querySelector("svg");
    if (!holder || !builtIn) return;

    // Header starts with a copy of the built-in icon so it is never empty.
    ui.chatHeaderIcon?.replaceChildren(builtIn.cloneNode(true));

    const url = cfg?.launcherIconUrl;
    if (!url) return;

    const img = new Image();
    img.alt = "";
    img.onload = () => {
      builtIn.replaceWith(img);
      ui.chatHeaderIcon?.replaceChildren(img.cloneNode());
    };
    img.onerror = () => console.warn("[ocpf] launcherIconUrl could not be loaded:", url);
    img.src = url;
  }

  function setStatus(message, isError = false) {
    ui.chatStatus.textContent = message;
    ui.chatStatus.className = `chat-status visible${isError ? " error" : ""}`;
  }

  function clearStatus() {
    ui.chatStatus.textContent = "";
    ui.chatStatus.className = "chat-status";
  }

  function showTyping() {
    ui.typingIndicator.classList.add("visible");
    scrollMessagesToBottom();
    clearTimeout(state.typingTimeout);
    state.typingTimeout = setTimeout(hideTyping, 5000);
  }

  function hideTyping() {
    clearTimeout(state.typingTimeout);
    ui.typingIndicator.classList.remove("visible");
  }

  function addUserMessage(text, files = []) {
    const node = document.createElement("div");
    node.className = "message user";
    if (text) {
      const body = document.createElement("div");
      body.textContent = text;
      node.appendChild(body);
    }

    if (files.length) {
      const list = document.createElement("div");
      list.className = "message__files";
      files.forEach((entry) => {
        const chip = document.createElement("span");
        chip.className = "message__file";
        chip.textContent = entry.file.name;
        chip.title = entry.file.name;
        list.appendChild(chip);
      });
      node.appendChild(list);
    }

    ui.messages.insertBefore(node, ui.typingIndicator);
    scrollMessagesToBottom();
  }

  function addAgentMessage(markdownText, entities, activity) {
    const node = document.createElement("div");
    node.className = "message agent";
    node.innerHTML = marked.parse(markdownText);

    node.querySelectorAll("a").forEach((link) => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    const citationEntity = entities?.find(
      (entity) => entity.type === "https://schema.org/Message" && Array.isArray(entity.citation)
    );

    if (citationEntity?.citation?.length) {
      const sources = document.createElement("div");
      sources.className = "sources";

      const header = document.createElement("b");
      header.textContent = "Sources";
      sources.appendChild(header);

      citationEntity.citation.forEach((citation) => {
        const name = citation.appearance?.name || citation.appearance?.abstract || "Source";
        const url = citation.appearance?.url;
        const label = `${citation.position}. ${name}`;

        if (!url) {
          const text = document.createElement("span");
          text.textContent = label;
          sources.appendChild(text);
          return;
        }

        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;
        sources.appendChild(link);
      });

      node.appendChild(sources);
    }

    if (activity && shouldShowFeedback(activity)) {
      node.appendChild(buildFeedbackControls(activity));
    }

    ui.messages.insertBefore(node, ui.typingIndicator);
    scrollMessagesToBottom();
  }

  function renderSuggestedActions(actions) {
    ui.suggestedActions.innerHTML = "";

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.title || action.value || "Option";
      button.addEventListener("click", () => {
        sendMessage(action.value || action.title || "");
        ui.suggestedActions.innerHTML = "";
      });

      ui.suggestedActions.appendChild(button);
    });

    scrollMessagesToBottom();
  }

  function scrollMessagesToBottom() {
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }
})();
