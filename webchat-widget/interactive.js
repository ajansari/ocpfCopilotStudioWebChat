/*
  interactive.js - "Try it yourself" settings drawer for index-interactive.html.

  How it works
  ------------
  1. config.js has already run and set window.ocpfConfig. A deep copy of it is taken
     here as the DEFAULTS and mirrored into sessionStorage (secrets excluded) so the
     values can be inspected and restored at any time.
  2. The user's edits are kept in sessionStorage (this browser tab only). They are
     never written to config.js or any file on disk.
  3. "Try It" merges the edits over the defaults, swaps window.ocpfConfig, re-inserts
     the widget markup and reloads app.js, which starts a fresh conversation.
  4. "Reset to defaults" clears the stored edits, repopulates the form and rebuilds the
     widget from the defaults.

  This file must be loaded AFTER config.js (and directline.js) and BEFORE app.js.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "ocpf.interactive.settings";   // the user's edits (this tab only)
  const DEFAULTS_KEY = "ocpf.interactive.defaults";  // snapshot of config.js (no secrets)

  const clone = (value) => JSON.parse(JSON.stringify(value));

  // Any CSS colour -> "#rrggbb" (what <input type="color"> needs); fallback if unparseable.
  function toHex(color, fallback) {
    if (typeof color !== "string" || !color.trim()) return fallback;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color.trim();
    const value = String(ctx.fillStyle);
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
  }

  // ---- 1. Snapshot the defaults from config.js ----------------------------------
  const DEFAULTS = clone(window.ocpfConfig || {});
  window.ocpfDefaults = clone(DEFAULTS);
  try {
    const safe = clone(DEFAULTS);
    if (safe.directLine) {
      delete safe.directLine.primarySecret;
      delete safe.directLine.secondarySecret;
    }
    sessionStorage.setItem(DEFAULTS_KEY, JSON.stringify(safe));
  } catch { /* storage unavailable (private window etc.) - defaults still live in memory */ }

  // Keys the drawer can change. Everything else always comes from config.js.
  const TEXT_KEYS = ["chatTitle", "inputPlaceholder", "launcherLabelFull", "launcherLabelCompact"];
  const NUMBER_KEYS = { fontSizeAdjust: [-8, 8], launcherOffsetUp: [0, 400], launcherOffsetLeft: [0, 400] };
  const STYLE_KEYS = ["full", "compact", "icon", "fulltext", "compacttext"];
  const FEEDBACK_KEYS = ["auto", "always", "never"];
  const MODE_KEYS = ["floating", "sidecar", "fullscreen"];
  const POSITION_KEYS = ["bottom-right", "top-right"];
  const BOOL_KEYS = ["fileUploads", "sidecarResizable", "sidecarPushPage", "closeButton", "openOnLoad"];
  // Sizes are kept as text: "420" (px), "30%", "25vw" ... exactly as app.js accepts them.
  const SIZE_KEYS = { sidecarWidth: "420", fullscreenWidth: "100%", fullscreenHeight: "100%" };

  const withUnit = (v) => (/^\d+(\.\d+)?$/.test(v) ? `${v}px` : v);   // "420" -> "420px"
  const closing = (s) => (s.closeButton
    ? "The launcher hides while it is open; the X (or Escape) brings the page back."
    : "No X: the launcher stays on top of the window as the way back, and Escape closes too.");
  const MODE_HELP = {
    floating: (s) => `A window next to the launcher in the corner (${s.launcherPosition === "top-right" ? "below it" : "above it"}). The launcher reads "Close chat" while it is open. This is the default.`,
    sidecar: (s) => `A panel docked to the right edge, the full height of the window, like Copilot in Edge or Office. ${withUnit(s.sidecarWidth)} wide${s.sidecarResizable ? ", and the visitor can drag its left edge" : ""}. ${closing(s)}`,
    fullscreen: (s) => `${s.fullscreenWidth === "100%" && s.fullscreenHeight === "100%" ? "Covers the whole browser window" : `A ${withUnit(s.fullscreenWidth)} × ${withUnit(s.fullscreenHeight)} window centred over the dimmed page`}. ${closing(s)}`
  };

  // A size as app.js accepts it (number = px, or text with px/%/vw/vh/rem/em), or the fallback.
  function toSize(value, fallback) {
    const v = Number.isFinite(value) ? String(value) : (typeof value === "string" ? value.trim() : "");
    return /^\d+(\.\d+)?(px|%|vw|vh|rem|em)?$/.test(v) && parseFloat(v) > 0 ? v : fallback;
  }
  const sizeLiteral = (v) => (/^\d+$/.test(v) ? v : JSON.stringify(v));   // 420 or "30%"

  const LAUNCHER_STYLE_HELP = {
    full: (d) => `Icon + "${d.launcherLabelFull}". Reads "Close chat" while the window is open. This is the default.`,
    compact: (d) => `Icon + "${d.launcherLabelCompact}". Reads "Close" while open. Good when the corner is tight.`,
    icon: () => `Round button with the icon only; turns into an X while open. Smallest footprint, no text.`,
    fulltext: (d) => `"${d.launcherLabelFull}" only, no icon.`,
    compacttext: (d) => `"${d.launcherLabelCompact}" only, no icon. The smallest text-only button.`
  };

  // ---- 2. Settings = defaults + stored edits --------------------------------------
  function defaultSettings() {
    return {
      chatTitle: DEFAULTS.chatTitle ?? "",
      inputPlaceholder: DEFAULTS.inputPlaceholder ?? "",
      launcherColor: toHex(DEFAULTS.launcherColor, "#3b8ad9"),
      inputBoxColor: toHex(DEFAULTS.inputBoxColor, "#ffffff"),
      launcherStyle: STYLE_KEYS.includes(DEFAULTS.launcherStyle) ? DEFAULTS.launcherStyle : "full",
      launcherLabelFull: DEFAULTS.launcherLabelFull ?? "",
      launcherLabelCompact: DEFAULTS.launcherLabelCompact ?? "",
      fontSizeAdjust: Number.isFinite(DEFAULTS.fontSizeAdjust) ? DEFAULTS.fontSizeAdjust : 0,
      launcherPosition: POSITION_KEYS.includes(DEFAULTS.launcherPosition) ? DEFAULTS.launcherPosition : "bottom-right",
      launcherOffsetUp: Number.isFinite(DEFAULTS.launcherOffsetUp) ? DEFAULTS.launcherOffsetUp : 0,
      launcherOffsetLeft: Number.isFinite(DEFAULTS.launcherOffsetLeft) ? DEFAULTS.launcherOffsetLeft : 0,
      fileUploads: DEFAULTS.fileUploads !== false,
      feedbackButtons: FEEDBACK_KEYS.includes(DEFAULTS.feedbackButtons) ? DEFAULTS.feedbackButtons : "auto",
      displayMode: MODE_KEYS.includes(DEFAULTS.displayMode) ? DEFAULTS.displayMode : "floating",
      sidecarWidth: toSize(DEFAULTS.sidecarWidth, SIZE_KEYS.sidecarWidth),
      sidecarResizable: DEFAULTS.sidecarResizable !== false,
      sidecarPushPage: DEFAULTS.sidecarPushPage === true,
      fullscreenWidth: toSize(DEFAULTS.fullscreenWidth, SIZE_KEYS.fullscreenWidth),
      fullscreenHeight: toSize(DEFAULTS.fullscreenHeight, SIZE_KEYS.fullscreenHeight),
      closeButton: DEFAULTS.closeButton !== false,
      openOnLoad: DEFAULTS.openOnLoad === true,
      primarySecret: "",    // blank = use the agent from config.js
      secondarySecret: "",
      launcherIconData: ""  // data: URL of an uploaded icon, "" = icon from config.js
    };
  }

  function loadSettings() {
    const base = defaultSettings();
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      return sanitize({ ...base, ...JSON.parse(raw) });
    } catch {
      return base;
    }
  }

  function saveSettings(settings) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }

  function clearSettings() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  function sanitize(s) {
    const d = defaultSettings();
    const out = { ...s };
    TEXT_KEYS.forEach((k) => { out[k] = typeof out[k] === "string" ? out[k].trim() : d[k]; });
    Object.entries(NUMBER_KEYS).forEach(([k, [min, max]]) => {
      const n = Number(out[k]);
      out[k] = Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d[k];
    });
    out.launcherStyle = STYLE_KEYS.includes(out.launcherStyle) ? out.launcherStyle : d.launcherStyle;
    out.launcherColor = toHex(out.launcherColor, d.launcherColor);
    out.inputBoxColor = toHex(out.inputBoxColor, d.inputBoxColor);
    out.feedbackButtons = FEEDBACK_KEYS.includes(out.feedbackButtons) ? out.feedbackButtons : d.feedbackButtons;
    out.displayMode = MODE_KEYS.includes(out.displayMode) ? out.displayMode : d.displayMode;
    out.launcherPosition = POSITION_KEYS.includes(out.launcherPosition) ? out.launcherPosition : d.launcherPosition;
    Object.keys(SIZE_KEYS).forEach((k) => { out[k] = toSize(out[k], d[k]); });
    BOOL_KEYS.forEach((k) => { out[k] = out[k] === true || out[k] === "true"; });
    out.primarySecret = typeof out.primarySecret === "string" ? out.primarySecret.trim() : "";
    out.secondarySecret = typeof out.secondarySecret === "string" ? out.secondarySecret.trim() : "";
    out.launcherIconData = typeof out.launcherIconData === "string" && out.launcherIconData.startsWith("data:image/") ? out.launcherIconData : "";
    return out;
  }

  // Builds the window.ocpfConfig object app.js will read.
  function buildConfig(settings) {
    const cfg = clone(DEFAULTS);
    cfg.chatTitle = settings.chatTitle || DEFAULTS.chatTitle;
    cfg.inputPlaceholder = settings.inputPlaceholder || DEFAULTS.inputPlaceholder;
    cfg.launcherStyle = settings.launcherStyle;
    cfg.launcherColor = settings.launcherColor;
    cfg.inputBoxColor = settings.inputBoxColor;
    cfg.launcherLabelFull = settings.launcherLabelFull || DEFAULTS.launcherLabelFull;
    cfg.launcherLabelCompact = settings.launcherLabelCompact || DEFAULTS.launcherLabelCompact;
    cfg.fontSizeAdjust = settings.fontSizeAdjust;
    cfg.launcherPosition = settings.launcherPosition;
    cfg.launcherOffsetUp = settings.launcherOffsetUp;
    cfg.launcherOffsetLeft = settings.launcherOffsetLeft;
    cfg.fileUploads = settings.fileUploads;
    cfg.feedbackButtons = settings.feedbackButtons;
    cfg.displayMode = settings.displayMode;
    cfg.sidecarWidth = settings.sidecarWidth;
    cfg.sidecarResizable = settings.sidecarResizable;
    cfg.sidecarPushPage = settings.sidecarPushPage;
    cfg.fullscreenWidth = settings.fullscreenWidth;
    cfg.fullscreenHeight = settings.fullscreenHeight;
    cfg.closeButton = settings.closeButton;
    cfg.openOnLoad = settings.openOnLoad;
    if (settings.launcherIconData) cfg.launcherIconUrl = settings.launcherIconData;
    cfg.directLine = cfg.directLine || {};
    if (settings.primarySecret) {
      // Own agent: never fall back to the default agent's secondary secret.
      cfg.directLine.primarySecret = settings.primarySecret;
      cfg.directLine.secondarySecret = settings.secondarySecret || "";
    }
    return cfg;
  }

  // ---- 3. Keep a handle on the live Direct Line connection ------------------------
  // app.js does not expose its connection, so the DirectLine constructor is wrapped to
  // remember the latest instance. It is ended before the widget is rebuilt so no stale
  // web socket is left behind.
  let liveConnection = null;
  if (window.DirectLine?.DirectLine) {
    const Original = window.DirectLine.DirectLine;
    const Wrapped = function (options) {
      const instance = new Original(options);
      liveConnection = instance;
      return instance;
    };
    Wrapped.prototype = Original.prototype;
    window.DirectLine.DirectLine = Wrapped;
  }

  // ---- 4. Widget rebuild ----------------------------------------------------------
  const mount = document.getElementById("ocpfWidgetMount");
  const widgetMarkup = mount ? mount.innerHTML : "";
  let appScript = document.getElementById("ocpfAppScript");

  function endLiveConnection() {
    if (!liveConnection) return;
    // Ending the connection errors the old widget's activity stream with "conversation
    // ended"; app.js has no error handler for it, so it would be logged as an uncaught
    // error. It is thrown from directline.js on the CDN, so the browser masks it as
    // "Script error."; both forms are swallowed for a moment after end().
    const swallow = (event) => {
      const message = String(event.message || event.reason?.message || "");
      if (message.includes("conversation ended") || message === "Script error.") event.preventDefault();
    };
    window.addEventListener("error", swallow);
    window.addEventListener("unhandledrejection", swallow);
    try { liveConnection.end(); } catch { /* ignore */ }
    liveConnection = null;
    setTimeout(() => {
      window.removeEventListener("error", swallow);
      window.removeEventListener("unhandledrejection", swallow);
    }, 1500);
  }

  function rebuildWidget(cfg) {
    endLiveConnection();

    // Root CSS variables are set by app.js only when a value is finite; clear them so a
    // previous run cannot bleed into this one.
    const root = document.documentElement.style;
    ["--chat-font-adjust", "--launcher-offset-up", "--launcher-offset-left",
     "--sidecar-width", "--fullscreen-width", "--fullscreen-height", "--chat-sidecar-push"].forEach((v) => root.removeProperty(v));
    document.body.style.paddingRight = "";   // undone sidecarPushPage from the previous run
    document.body.style.overflow = "";       // undone fullscreen scroll lock from the previous run

    mount.innerHTML = widgetMarkup;
    window.ocpfConfig = cfg;

    appScript?.remove();
    appScript = document.createElement("script");
    appScript.id = "ocpfAppScript";
    appScript.src = `./app.js?reload=${Date.now()}`;   // cache-buster forces a fresh run
    document.body.appendChild(appScript);
  }

  // ---- 5. Form wiring -------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    toggle: $("ixToggle"),
    panel: $("ixPanel"),
    close: $("ixClose"),
    form: $("ixForm"),
    styleHelp: $("ixStyleHelp"),
    modeHelp: $("ixModeHelp"),
    sidecarFields: $("ixSidecarFields"),
    fullscreenFields: $("ixFullscreenFields"),
    status: $("ixStatus"),
    agentBadge: $("ixAgentBadge"),
    snippet: $("ixSnippet"),
    copy: $("ixCopy"),
    reset: $("ixReset"),
    iconFile: $("ixIconFile"),
    iconPreview: $("ixIconPreview"),
    iconReset: $("ixIconReset"),
    iconStatus: $("ixIconStatus")
  };

  // ---- Icon upload: scaled and centre-cropped to the recommended 136 x 136 px ------
  const ICON_SIZE = 136;
  const DEFAULT_ICON = DEFAULTS.launcherIconUrl || "";
  let pendingIcon = ""; // data: URL chosen in the form but not yet applied

  function showIcon(dataUrl) {
    pendingIcon = dataUrl || "";
    el.iconPreview.src = pendingIcon || DEFAULT_ICON || "";
    el.iconPreview.hidden = !el.iconPreview.src;
    el.iconReset.hidden = !pendingIcon;
  }

  function scaleIcon(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth || ICON_SIZE;
        const h = img.naturalHeight || ICON_SIZE;
        const side = Math.min(w, h);             // centre-crop to a square ...
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = ICON_SIZE; // ... then scale to 136 x 136
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, ICON_SIZE, ICON_SIZE);
        resolve({ dataUrl: canvas.toDataURL("image/png"), width: w, height: h });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("not an image the browser can read")); };
      img.src = url;
    });
  }

  el.iconFile?.addEventListener("change", async () => {
    const file = el.iconFile.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, width, height } = await scaleIcon(file);
      showIcon(dataUrl);
      const note = width === height ? "" : " (non-square, centre-cropped)";
      el.iconStatus.textContent = `${file.name}: ${width} × ${height} px, scaled to ${ICON_SIZE} × ${ICON_SIZE}${note}. Press Try It to apply.`;
    } catch (error) {
      el.iconStatus.textContent = `Could not use "${file.name}": ${error.message}.`;
    }
    refreshDerived(readForm());
  });

  el.iconReset?.addEventListener("click", () => {
    showIcon("");
    el.iconFile.value = "";
    el.iconStatus.textContent = "Back to the icon from config.js. Press Try It to apply.";
    refreshDerived(readForm());
  });

  const fields = {
    chatTitle: $("ixChatTitle"),
    inputPlaceholder: $("ixInputPlaceholder"),
    launcherStyle: $("ixLauncherStyle"),
    launcherColor: $("ixLauncherColor"),
    inputBoxColor: $("ixInputBoxColor"),
    launcherLabelFull: $("ixLauncherLabelFull"),
    launcherLabelCompact: $("ixLauncherLabelCompact"),
    fontSizeAdjust: $("ixFontSizeAdjust"),
    launcherPosition: $("ixLauncherPosition"),
    launcherOffsetUp: $("ixLauncherOffsetUp"),
    launcherOffsetLeft: $("ixLauncherOffsetLeft"),
    fileUploads: $("ixFileUploads"),
    feedbackButtons: $("ixFeedbackButtons"),
    displayMode: $("ixDisplayMode"),
    sidecarWidth: $("ixSidecarWidth"),
    sidecarResizable: $("ixSidecarResizable"),
    sidecarPushPage: $("ixSidecarPushPage"),
    fullscreenWidth: $("ixFullscreenWidth"),
    fullscreenHeight: $("ixFullscreenHeight"),
    closeButton: $("ixCloseButton"),
    openOnLoad: $("ixOpenOnLoad"),
    primarySecret: $("ixPrimarySecret"),
    secondarySecret: $("ixSecondarySecret")
  };

  if (!el.form || !mount) return; // drawer markup missing: fall through to the plain widget

  function fillForm(settings) {
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) return;
      input.value = String(settings[key]);
    });
    showIcon(settings.launcherIconData);
    refreshDerived(settings);
  }

  function readForm() {
    const raw = {};
    Object.entries(fields).forEach(([key, input]) => { if (input) raw[key] = input.value; });
    raw.launcherIconData = pendingIcon;
    return sanitize(raw);
  }

  function refreshDerived(settings) {
    // Launcher style explanation follows the dropdown.
    const d = defaultSettings();
    const describe = LAUNCHER_STYLE_HELP[settings.launcherStyle] || LAUNCHER_STYLE_HELP.full;
    el.styleHelp.textContent = describe({
      launcherLabelFull: settings.launcherLabelFull || d.launcherLabelFull,
      launcherLabelCompact: settings.launcherLabelCompact || d.launcherLabelCompact
    });

    // Display mode explanation, and only the size fields that apply to the chosen mode.
    const describeMode = MODE_HELP[settings.displayMode] || MODE_HELP.floating;
    el.modeHelp.textContent = describeMode(settings);
    if (el.sidecarFields) el.sidecarFields.hidden = settings.displayMode !== "sidecar";
    if (el.fullscreenFields) el.fullscreenFields.hidden = settings.displayMode !== "fullscreen";

    // Mark fields that differ from config.js.
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) return;
      const changed = String(settings[key]) !== String(d[key]);
      input.closest(".ix-field")?.classList.toggle("is-changed", changed);
    });
    el.iconFile?.closest(".ix-field")?.classList.toggle("is-changed", Boolean(settings.launcherIconData));

    $("ixLauncherColorHex").value = settings.launcherColor;
    $("ixInputBoxColorHex").value = settings.inputBoxColor;

    el.snippet.value = toSnippet(settings);
  }

  // The current settings written the way they would appear in config.js.
  function toSnippet(s) {
    const q = (v) => JSON.stringify(v);
    const lines = [
      `chatTitle: ${q(s.chatTitle)},`,
      s.launcherIconData
        ? `launcherIconUrl: "images/chat-icon.png",   // save your 136 x 136 icon there`
        : `launcherIconUrl: ${q(DEFAULTS.launcherIconUrl ?? "")},`,
      `inputPlaceholder: ${q(s.inputPlaceholder)},`,
      `launcherColor: ${q(s.launcherColor)},`,
      `inputBoxColor: ${q(s.inputBoxColor)},`,
      `launcherStyle: ${q(s.launcherStyle)},`,
      `launcherLabelFull: ${q(s.launcherLabelFull)},`,
      `launcherLabelCompact: ${q(s.launcherLabelCompact)},`,
      `fontSizeAdjust: ${s.fontSizeAdjust},`,
      `launcherPosition: ${q(s.launcherPosition)},`,
      `launcherOffsetUp: ${s.launcherOffsetUp},`,
      `launcherOffsetLeft: ${s.launcherOffsetLeft},`,
      `displayMode: ${q(s.displayMode)},`,
      `sidecarWidth: ${sizeLiteral(s.sidecarWidth)},`,
      `sidecarResizable: ${s.sidecarResizable},`,
      `sidecarPushPage: ${s.sidecarPushPage},`,
      `fullscreenWidth: ${sizeLiteral(s.fullscreenWidth)},`,
      `fullscreenHeight: ${sizeLiteral(s.fullscreenHeight)},`,
      `closeButton: ${s.closeButton},`,
      `openOnLoad: ${s.openOnLoad},`,
      `fileUploads: ${s.fileUploads},`,
      `feedbackButtons: ${q(s.feedbackButtons)},`
    ];
    if (s.primarySecret) {
      lines.push(
        `directLine: {`,
        `  primarySecret: "<your Secret 1>",`,
        `  secondarySecret: ${s.secondarySecret ? `"<your Secret 2>"` : `""`},`,
        `  ...`,
        `}`
      );
    }
    return lines.join("\n");
  }

  function setStatus(message, kind = "") {
    el.status.textContent = message;
    el.status.className = `ix-status${kind ? ` ix-status--${kind}` : ""}`;
  }

  function showAgent(settings) {
    const own = Boolean(settings.primarySecret);
    el.agentBadge.textContent = own ? "Agent: your secrets" : "Agent: default from config.js";
    el.agentBadge.classList.toggle("is-own", own);
  }

  function apply(settings, note, { persist = true } = {}) {
    if (persist) saveSettings(settings); else clearSettings();
    if (!persist) { el.iconFile.value = ""; el.iconStatus.textContent = ""; }
    fillForm(settings);
    rebuildWidget(buildConfig(settings));
    showAgent(settings);
    setStatus(note, "ok");
  }

  // Live help text and change markers while typing (nothing is applied until Try It).
  el.form.addEventListener("input", () => refreshDerived(readForm()));

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const settings = readForm();
    if (settings.secondarySecret && !settings.primarySecret) {
      setStatus("Enter a primary secret (Secret 1) before adding a secondary one.", "error");
      fields.primarySecret.focus();
      return;
    }
    apply(settings, "Applied. The widget was rebuilt and a new conversation started.");
  });

  el.reset.addEventListener("click", () => {
    apply(defaultSettings(), "Reset. Everything is back to the values in config.js.", { persist: false });
  });

  // Show / hide secret text.
  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.reveal);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(show));
    });
  });

  el.copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(el.snippet.value);
      el.copy.textContent = "Copied";
      setTimeout(() => { el.copy.textContent = "Copy"; }, 1500);
    } catch {
      el.snippet.select();
    }
  });

  // ---- 7. Package download: zip with the widget files + a config.js for these settings ----
  const PACKAGE_DIR = "ocpf-chat";
  const STATIC_FILES = [
    "app.js", "chat-widget.css", "images/README.md",
    "fonts/selawk.woff2", "fonts/selawksb.woff2", "fonts/selawksl.woff2", "fonts/SELAWIK-LICENSE.txt"
  ];
  const DOC_FILES = ["EMBEDDING_INSTRUCTIONS.md", "CONFIGURATION.md"];

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error("the zip library could not be loaded from the CDN"));
      document.head.appendChild(script);
    });
  }

  async function fetchFile(path) {
    const response = await fetch(`./${path}`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${path} could not be read (${response.status})`);
    return response.blob();
  }

  // The CDN script tags, exactly as this page loads them.
  function cdnScripts() {
    return Array.from(document.querySelectorAll("script[src]"))
      .map((s) => s.getAttribute("src"))
      .filter((src) => /^https?:/.test(src) && !/jszip/i.test(src));
  }

  function dedent(markup) {
    const lines = markup.replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(indent)).join("\n");
  }

  function embedHtml() {
    const scripts = cdnScripts().map((src) => `<script src="${src}"></script>`).join("\n");
    return [
      `<!-- ===== START: OnlyCopilotFans chat widget. Paste this whole block just before </body>. =====`,
      `     Upload the "${PACKAGE_DIR}" folder next to this page first. If the folder lives somewhere`,
      `     else, change the four "${PACKAGE_DIR}/" paths below and launcherIconUrl in config.js. -->`,
      `<link rel="stylesheet" href="${PACKAGE_DIR}/chat-widget.css" />`,
      ``,
      dedent(widgetMarkup),
      ``,
      `<!-- Scripts, in this order -->`,
      scripts,
      `<script src="${PACKAGE_DIR}/config.js"></script>`,
      `<script src="${PACKAGE_DIR}/app.js"></script>`,
      `<!-- ===== END: OnlyCopilotFans chat widget ===== -->`
    ].join("\n") + "\n";
  }

  const cornerName = (s) => (s.launcherPosition === "top-right" ? "top-right" : "bottom-right");

  function exampleHtml(s) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chat widget test page</title>
  <style>body { font-family: system-ui, sans-serif; margin: 3rem; color: #333; }</style>
</head>
<body>
  <h1>Chat widget test page</h1>
  <p>This is a plain page with the OnlyCopilotFans chat widget embedded. Open it in a browser
     and the launcher appears in the ${cornerName(s)} corner. The same block, EMBED.html, goes into
     your own page.</p>

${embedHtml().split("\n").map((l) => (l ? "  " + l : l)).join("\n")}</body>
</html>
`;
  }

  function configJs(s, hasIcon) {
    const q = (v) => JSON.stringify(v);
    const dl = DEFAULTS.directLine || {};
    const secret1 = s.primarySecret || "PASTE_YOUR_SECRET_1_HERE";
    const secret2 = s.primarySecret ? s.secondarySecret : "PASTE_YOUR_SECRET_2_HERE_OR_LEAVE_EMPTY";
    return `/*
  OnlyCopilotFans chat widget configuration, generated from the interactive demo.
  Every option is explained in CONFIGURATION.md.
*/
window.ocpfConfig = {
  // Title shown in the chat window header (next to the icon).
  chatTitle: ${q(s.chatTitle)},

  // Placeholder text shown in the message box before the user types.
  inputPlaceholder: ${q(s.inputPlaceholder)},

  // Icon on the launcher button and in the chat window title bar, relative to the PAGE that
  // embeds the widget (not to this file). "" = built-in robot icon.
  launcherIconUrl: ${q(hasIcon ? `${PACKAGE_DIR}/images/chat-icon.png` : "")},

  // Launcher button color. A darker shade for the gradient is derived automatically.
  launcherColor: ${q(s.launcherColor)},

  // Background color of the message box where the visitor types.
  inputBoxColor: ${q(s.inputBoxColor)},

  // Launcher button size: "full" | "compact" | "icon" | "fulltext" | "compacttext"
  launcherStyle: ${q(s.launcherStyle)},

  // Launcher button text when the chat is closed.
  launcherLabelFull: ${q(s.launcherLabelFull)},      // used by "full" and "fulltext"
  launcherLabelCompact: ${q(s.launcherLabelCompact)}, // used by "compact" and "compacttext"

  // Added to every font size in the widget, in pixels (0 = default).
  fontSizeAdjust: ${s.fontSizeAdjust},

  // Corner the launcher is pinned to: "bottom-right" | "top-right".
  launcherPosition: ${q(s.launcherPosition)},

  // Distance from that corner, in pixels (0 and 0 = the corner). launcherOffsetUp moves
  // up from the bottom edge, or down from the top edge with "top-right".
  launcherOffsetUp: ${s.launcherOffsetUp},
  launcherOffsetLeft: ${s.launcherOffsetLeft},

  // How the chat window opens: "floating" (corner window) | "sidecar" (docked to the right
  // edge, full height, like Copilot in Edge) | "fullscreen" (covers the browser window).
  displayMode: ${q(s.displayMode)},

  // Sidecar: width in pixels (420) or as text ("30%"); drag-to-resize; push the page left.
  sidecarWidth: ${sizeLiteral(s.sidecarWidth)},
  sidecarResizable: ${s.sidecarResizable},
  sidecarPushPage: ${s.sidecarPushPage},

  // Fullscreen: "100%" fills the window; smaller sizes ("80%", 900) are centred over a dimmed page.
  fullscreenWidth: ${sizeLiteral(s.fullscreenWidth)},
  fullscreenHeight: ${sizeLiteral(s.fullscreenHeight)},

  // X at the top right of the chat window (false = hidden; the launcher stays visible instead).
  closeButton: ${s.closeButton},

  // true = the chat window is already open when the page loads.
  openOnLoad: ${s.openOnLoad},

  // Optional features. The AGENT must support them too: Copilot Studio > agent > Settings >
  // Generative AI > "File uploads" / "Collect user reactions to agent messages", then publish.
  fileUploads: ${s.fileUploads},
  feedbackButtons: ${q(s.feedbackButtons)},   // "auto" | "always" | "never"

  // Direct Line secrets: Copilot Studio > agent > Settings > Security > Web channel security.
  // The agent must run with Authentication set to "No authentication".
  // As of October 8, 2026 Direct Line is only available for classic experience agents
  // (standard harness); new experience agents (GitHub Copilot harness) show Online but
  // never reply. Use the iframe embed for those until Direct Line supports them.
  directLine: {
    primarySecret: ${q(secret1)},
    secondarySecret: ${q(secret2)},
    tokenGenerationEndpoint: ${q(dl.tokenGenerationEndpoint || "https://directline.botframework.com/v3/directline/tokens/generate")},
    domain: ${q(dl.domain || "https://directline.botframework.com/v3/directline")},
    locale: ${q(dl.locale || "en-US")}
  }
};
`;
  }

  function readmeMd(s, hasIcon) {
    const secrets = s.primarySecret
      ? `**Your Direct Line secret is inside \`${PACKAGE_DIR}/config.js\`.** Anyone with that file can talk to your agent, so keep the zip private.`
      : `\`${PACKAGE_DIR}/config.js\` has placeholder secrets. Open it and paste your own Secret 1 (and optionally Secret 2) before uploading.`;
    return `# OnlyCopilotFans chat widget - your package

Generated from the interactive demo with your settings. Nothing was uploaded anywhere; this zip
was built in your browser.

## What is inside

| File | What it is |
|---|---|
| \`EMBED.html\` | The code to paste into your page: stylesheet link, widget markup, scripts. |
| \`example.html\` | A plain test page with the widget already embedded. Open it to check the package works. |
| \`${PACKAGE_DIR}/config.js\` | Your settings${s.primarySecret ? " and secrets" : ""}. The only file you will normally edit. |
| \`${PACKAGE_DIR}/app.js\` | The chat logic. Do not edit. |
| \`${PACKAGE_DIR}/chat-widget.css\` | The widget styling, scoped to the widget so it does not restyle your site. |
| \`${PACKAGE_DIR}/images/chat-icon.png\` | ${hasIcon ? "Your launcher icon, 136 x 136 px." : "Not included: the built-in robot icon is used. See images/README.md to add one."} |
| \`${PACKAGE_DIR}/fonts/\` | Fallback fonts, used only if Microsoft's font CDN is unreachable. |
| \`EMBEDDING_INSTRUCTIONS.md\`, \`CONFIGURATION.md\` | The full guides: every option, troubleshooting, WordPress details. |

## Before you start

${secrets}

Your Copilot Studio agent must allow this: Settings > Security > Authentication = **No authentication**.
The secrets are under Settings > Security > Web channel security; **Require secured access** on that page
is recommended but optional (the widget always sends a secret, so it works either way; on, the agent
refuses Direct Line callers that bring no secret). Publish the agent after changing any of these.

**Classic experience agents only (as of October 8, 2026).** Direct Line, which this widget uses, is
currently available for classic experience agents (standard harness). New experience agents (GitHub
Copilot harness) accept the secret and show *Online* but send no greeting or replies, because Microsoft
lists the Direct Line channel as not yet available for that harness. Use the iframe embed for those
agents until Direct Line support arrives.

## 1. A plain web page

1. Upload the \`${PACKAGE_DIR}\` folder next to the page.
2. Paste the contents of \`EMBED.html\` just before \`</body>\` of the page.
3. Open the page. The launcher appears ${cornerName(s)}.

\`example.html\` is exactly this, already done.

## 2. Another page of your site, or a different folder

Same steps. If the \`${PACKAGE_DIR}\` folder is not next to the page, change the four paths in
\`EMBED.html\` that start with \`${PACKAGE_DIR}/\`, and \`launcherIconUrl\` in \`config.js\`, to the
correct path or full URL, for example \`/assets/${PACKAGE_DIR}/app.js\`.

## 3. WordPress

1. Upload the \`${PACKAGE_DIR}\` folder with FTP or your host's file manager, for example to
   \`wp-content/uploads/${PACKAGE_DIR}/\`.
2. In \`EMBED.html\` and in \`config.js\` (\`launcherIconUrl\`), change the \`${PACKAGE_DIR}/\` paths to the
   full URL, for example \`https://yoursite.com/wp-content/uploads/${PACKAGE_DIR}/app.js\`.
3. Add the contents of \`EMBED.html\` to the site footer with a header-and-footer plugin
   (WPCode, "Insert Headers and Footers" or similar), or with your theme's custom footer code
   box. Avoid the block editor's Custom HTML block: it strips \`<script>\` tags.
4. Clear any caching plugin and reload.

\`EMBEDDING_INSTRUCTIONS.md\` has a theme-based alternative using \`wp_enqueue_script\`.

## Changing settings later

Edit \`${PACKAGE_DIR}/config.js\` and reload with a hard refresh (Ctrl/Cmd+Shift+R), since browsers
cache it. The interactive demo can generate a fresh config.js at any time.

\`displayMode\` in that file switches between the floating window, the right-hand sidecar and the
fullscreen chat without touching the HTML; the sizes, the X button and open-on-load live next to
it. CONFIGURATION.md explains each one.
`;
  }

  async function buildPackage(settings) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    const hasIcon = Boolean(settings.launcherIconData || DEFAULT_ICON);

    const files = await Promise.all(STATIC_FILES.concat(DOC_FILES).map((p) => fetchFile(p).then((blob) => [p, blob])));
    files.forEach(([path, blob]) => {
      zip.file(DOC_FILES.includes(path) ? path : `${PACKAGE_DIR}/${path}`, blob);
    });

    if (settings.launcherIconData) {
      zip.file(`${PACKAGE_DIR}/images/chat-icon.png`, settings.launcherIconData.split(",")[1], { base64: true });
    } else if (DEFAULT_ICON) {
      zip.file(`${PACKAGE_DIR}/images/chat-icon.png`, await fetchFile(DEFAULT_ICON));
    }

    zip.file(`${PACKAGE_DIR}/config.js`, configJs(settings, hasIcon));
    zip.file("EMBED.html", embedHtml());
    zip.file("example.html", exampleHtml(settings));
    zip.file("README.md", readmeMd(settings, hasIcon));
    return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  }

  const pkg = { download: $("ixDownload"), copyEmbed: $("ixCopyEmbed"), status: $("ixPackageStatus") };

  function setPackageStatus(message, kind = "") {
    pkg.status.textContent = message;
    pkg.status.className = `ix-status${kind ? ` ix-status--${kind}` : ""}`;
  }

  pkg.download?.addEventListener("click", async () => {
    const settings = readForm();
    pkg.download.disabled = true;
    setPackageStatus("Building your package...");
    try {
      const blob = await buildPackage(settings);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ocpf-chat-widget.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
      setPackageStatus(
        settings.primarySecret
          ? "Downloaded. Your secrets are inside ocpf-chat/config.js, so keep the zip private. Start with README.md."
          : "Downloaded. Paste your secrets into ocpf-chat/config.js, then start with README.md.",
        "ok"
      );
    } catch (error) {
      const offline = location.protocol === "file:";
      setPackageStatus(
        offline
          ? "The package can only be built when this page is opened over http(s), not from a file on disk."
          : `Could not build the package: ${error.message}.`,
        "error"
      );
    } finally {
      pkg.download.disabled = false;
    }
  });

  pkg.copyEmbed?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(embedHtml());
      setPackageStatus("Embed code copied. It expects the ocpf-chat folder from the package next to your page.", "ok");
    } catch {
      setPackageStatus("Could not copy. Download the package and use EMBED.html instead.", "error");
    }
  });

  // Drawer open / close. Open by default on wide screens; the choice is remembered per tab.
  function setDrawerOpen(open) {
    el.panel.hidden = !open;
    el.toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("ix-open", open);
    try { sessionStorage.setItem("ocpf.interactive.drawer", open ? "1" : "0"); } catch { /* ignore */ }
  }
  el.toggle.addEventListener("click", () => setDrawerOpen(el.panel.hidden));
  el.close.addEventListener("click", () => setDrawerOpen(false));

  // "#customize" in the URL (the button on index.html) always opens the pane.
  let drawerPref = null;
  try { drawerPref = sessionStorage.getItem("ocpf.interactive.drawer"); } catch { /* ignore */ }
  if (location.hash === "#customize") {
    setDrawerOpen(true);
    history.replaceState(null, "", location.pathname + location.search);
  } else {
    setDrawerOpen(drawerPref === null ? window.innerWidth >= 1100 : drawerPref === "1");
  }

  // ---- 6. First load: apply stored edits (if any) before app.js runs ---------------
  const initial = loadSettings();
  fillForm(initial);
  window.ocpfConfig = buildConfig(initial);
  showAgent(initial);
  let hasStored = false;
  try { hasStored = Boolean(sessionStorage.getItem(STORAGE_KEY)); } catch { /* ignore */ }
  if (hasStored) {
    setStatus("Loaded the settings from your last Try It in this tab. Press Reset to defaults to clear them.");
  }
})();
