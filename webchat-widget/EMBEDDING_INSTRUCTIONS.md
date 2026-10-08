# ocpf Chat Widget — Embedding Guide

How to put the chat widget on an existing website. For the full settings reference (icon,
colours, display modes, launcher styles, file uploads, feedback, troubleshooting) see
**`CONFIGURATION.md`** — this guide only covers the embedding steps.

The same HTML block and files serve all three display modes (floating window, right-hand
sidecar, fullscreen); `displayMode` in `config.js` picks one.

> **Which agents work (as of October 8, 2026):** Copilot Studio now has two agent runtimes,
> which Microsoft calls *harnesses*. This widget uses **Direct Line**, and Direct Line is
> currently offered only for **classic experience agents (standard harness)**. **New
> experience agents (GitHub Copilot harness)** list the Direct Line channel as "not currently
> available": the secret is accepted and the widget shows *Online*, but no greeting or replies
> ever arrive. Microsoft's channel table for the new harness lists only the demo website and
> the iframe embed as available today, so use the iframe (see `IframeVersion.html`) for those
> agents. Direct Line support for the new harness is expected to follow; check
> [Microsoft's channel availability page](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-overview)
> for the current status.

## What you need from this folder

| Copy | Purpose |
|---|---|
| `app.js` | chat logic |
| `chat-widget.css` | widget styling |
| `config.js` | icon, colour, feature toggles + Direct Line secrets (start from `config.sample.js`) |
| `images/chat-icon.png` | launcher / title-bar icon (or your own, see `images/README.md`) |
| `fonts/` | Selawik fallback fonts (used when Microsoft's font CDN is unreachable) |
| the widget HTML block below | the floating button + chat panel |

You do **not** need the placeholder page content in `index.html` (`.page-shell`, logo,
feature cards). `index.html` is a demo you take the widget block *out of*.

## The widget HTML block

This is the block between `<!-- ===== START: FLOATING CHAT WIDGET -->` and
`<!-- ===== END: FLOATING CHAT WIDGET -->` in `index.html`. If this guide and
`index.html` ever disagree, **`index.html` wins** — copy from there.

```html
<!-- ===== START: FLOATING CHAT WIDGET (expandable/collapsible) =====
     Copy everything between the START and END markers into the target page's <body>.
     Also required on the target page:
       - ./chat-widget.css  (chat-toggle, chat-panel, messages, etc.)
       - The scripts at the bottom of this file (directline.js, marked.min.js, config.js, app.js)
     Contains: launcher button (#chatToggle) + expandable chat panel (#chatPanel). -->
<button id="chatToggle" class="chat-toggle" aria-expanded="false" aria-controls="chatPanel" aria-label="Open ocpf chat">
  <span class="chat-toggle__icon" aria-hidden="true">
    <svg viewBox="0 0 64 64" role="img" focusable="false">
      <defs>
        <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4A90E2"></stop>
          <stop offset="100%" stop-color="#357ABD"></stop>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#002244"></circle>
      <rect x="16" y="18" width="32" height="28" rx="8" fill="url(#botGrad)"></rect>
      <circle cx="25" cy="31" r="3" fill="#ffffff"></circle>
      <circle cx="39" cy="31" r="3" fill="#ffffff"></circle>
      <path d="M24 39c2.1 2.2 4.9 3.3 8 3.3s5.9-1.1 8-3.3" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"></path>
      <rect x="28" y="12" width="8" height="6" rx="3" fill="#ffffff"></rect>
    </svg>
  </span>
  <span id="chatToggleLabel">Chat with ocpf</span>
  <svg class="chat-toggle__close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"></path></svg>
</button>

<aside id="chatPanel" class="chat-panel" aria-label="ocpf chat window" hidden>
  <header class="chat-panel__header">
    <div class="chat-panel__title-wrap">
      <span class="chat-panel__icon" id="chatHeaderIcon" aria-hidden="true"></span>
      <div>
        <h3 id="chatTitle">ocpf Assistant</h3>
        <div class="chat-panel__status">
          <span class="connection-dot" id="connectionDot" aria-hidden="true"></span>
          <p id="connectionText">Connecting...</p>
        </div>
      </div>
    </div>
    <div class="chat-panel__actions">
      <button id="chatRestart" class="chat-restart" type="button" aria-label="Start a new chat" title="Start a new chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 4v5h-5"></path></svg>
      </button>
      <button id="chatClose" class="chat-close" type="button" aria-label="Close chat">✕</button>
    </div>
  </header>

  <div id="chatStatus" class="chat-status" role="status" aria-live="polite"></div>

  <section id="messages" class="messages" aria-live="polite" aria-label="Conversation messages">
    <div id="typingIndicator" class="typing" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
  </section>

  <div id="suggestedActions" class="suggested-actions" aria-label="Suggested actions"></div>

  <div id="attachmentList" class="attachment-list" aria-label="Files to send"></div>

  <form id="messageForm" class="chat-input" autocomplete="off">
    <label for="messageInput" class="visually-hidden">Type your message</label>
    <input id="messageInput" name="message" type="text" placeholder="Type your message" disabled />
    <input id="fileInput" type="file" multiple class="visually-hidden" tabindex="-1"
           accept=".docx,.csv,.pdf,.txt,.jpg,.jpeg,.png,.webp,.gif" />
    <button id="attachButton" type="button" aria-label="Attach a file" title="Attach a file" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.2a1.5 1.5 0 0 1-2.1-2.1L16 7.7"></path></svg>
    </button>
    <span class="chat-input__divider" aria-hidden="true"></span>
    <button id="sendButton" type="submit" aria-label="Send message" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3 4l18 8-18 8 3-8-3-8z"></path><path d="M6 12h15"></path></svg>
    </button>
  </form>
</aside>
<!-- ===== END: FLOATING CHAT WIDGET (expandable/collapsible) ===== -->```

Every `id` in the block is required by `app.js` (`chatToggle`, `chatToggleLabel`,
`chatPanel`, `chatTitle`, `chatHeaderIcon`, `connectionDot`, `connectionText`, `chatRestart`,
`chatClose`, `chatStatus`, `messages`, `typingIndicator`, `suggestedActions`,
`attachmentList`, `messageForm`, `messageInput`, `fileInput`, `attachButton`,
`sendButton`). Change the visible text (labels, title, placeholder) freely; keep the ids.

---

## Option 1: Static HTML website

### 1) Create a widget folder

```text
/your-site-root
  /chat-widget
    app.js
    chat-widget.css
    config.js
    /images
      chat-icon.png
    /fonts
      selawk.woff2
      selawksl.woff2
      selawksb.woff2
      SELAWIK-LICENSE.txt
```

### 2) Update `config.js`

Edit `/your-site-root/chat-widget/config.js`. Every key is explained in
`CONFIGURATION.md` §3; the minimum is:

```js
window.ocpfConfig = {
  chatTitle: "ocpf Assistant",
  inputPlaceholder: "Type your message",
  launcherIconUrl: "/chat-widget/images/chat-icon.png",
  launcherColor: "#3b8ad9",
  launcherStyle: "full",          // full | compact | icon | fulltext | compacttext
  launcherLabelFull: "Chat with ocpf",
  launcherLabelCompact: "Chat",
  launcherPosition: "bottom-right", // or "top-right"
  launcherOffsetUp: 0,
  launcherOffsetLeft: 0,
  fontSizeAdjust: 0,              // -5 .. +5 px
  displayMode: "floating",        // floating | sidecar | fullscreen
  sidecarWidth: 420,              // px, or "30%"
  sidecarResizable: true,         // drag the sidecar's left edge
  sidecarPushPage: false,         // true = push the page content left while open
  fullscreenWidth: "100%",        // "100%" fills the window; "80%" or 900 is centred
  fullscreenHeight: "100%",
  closeButton: true,              // X at the top right of the chat window
  openOnLoad: false,              // true = open as soon as the page loads
  fileUploads: true,              // agent must have File uploads on + be re-published
  feedbackButtons: "auto",        // auto | always | never (agent must collect reactions)
  directLine: {
    primarySecret: "YOUR_DIRECT_LINE_SECRET_1",
    secondarySecret: "YOUR_DIRECT_LINE_SECRET_2",
    tokenGenerationEndpoint: "https://directline.botframework.com/v3/directline/tokens/generate",
    domain: "https://directline.botframework.com/v3/directline",
    locale: "en-US"
  }
};
```

`launcherIconUrl` is resolved relative to the **page**, not to `config.js` — use a
root-relative path (`/chat-widget/images/chat-icon.png`) or a full URL.

The secrets come from Copilot Studio → agent → **Settings** → **Security** → **Web channel
security**. **Require secured access** on that page is recommended but optional: the widget
always sends a secret, so it works either way; the switch only stops callers that bring no
secret. See `CONFIGURATION.md` §3 for the agent requirements.

### 3) Add CSS + HTML + JS to your page

In `<head>`:

```html
<link rel="stylesheet" href="/chat-widget/chat-widget.css" />
```

Anywhere in `<body>` (just before `</body>` is fine): paste the widget HTML block. The
block is the same for every `displayMode`; the sidecar's drag handle is added by `app.js`.

Then, after the block and before `</body>`:

```html
<script src="https://unpkg.com/botframework-directlinejs/dist/directline.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="/chat-widget/config.js"></script>
<script src="/chat-widget/app.js"></script>
```

Order matters: DirectLineJS and marked first, then `config.js`, then `app.js`.

### 4) Path rules

- Use root-relative (`/chat-widget/...`) or absolute URLs so the widget works from any
  page depth.
- `chat-widget.css` loads the fallback fonts from `./fonts/` relative to **itself**, so keep
  the `fonts/` folder next to `chat-widget.css`.

### 5) Deploy

Upload the folder and the edited pages. Serve over HTTPS. Hard-refresh (Ctrl/Cmd+Shift+R)
after changes — browsers cache `config.js`, `chat-widget.css` and images.

---

## Option 2: WordPress

Use a **child theme** so theme updates don't remove your changes.

### 1) Upload the widget files

```text
/wp-content/themes/your-child-theme/ocpf-chat/
  app.js
  chat-widget.css
  config.js
  images/chat-icon.png
  fonts/  (all four files)
```

### 2) Edit `config.js`

Set `launcherIconUrl` to the full path, e.g.
`/wp-content/themes/your-child-theme/ocpf-chat/images/chat-icon.png`, and fill in the
secrets and options as in Option 1 step 2.

### 3) Add to the child theme's `functions.php`

```php
<?php
add_action('wp_enqueue_scripts', function () {
    $base = get_stylesheet_directory_uri() . '/ocpf-chat';

    wp_enqueue_style('ocpf-chat-style', $base . '/chat-widget.css', [], null);

    wp_enqueue_script('ocpf-directline', 'https://unpkg.com/botframework-directlinejs/dist/directline.js', [], null, true);
    wp_enqueue_script('ocpf-marked', 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', [], null, true);

    wp_enqueue_script('ocpf-config', $base . '/config.js', [], null, true);
    wp_enqueue_script('ocpf-app', $base . '/app.js', ['ocpf-config', 'ocpf-directline', 'ocpf-marked'], null, true);
});

add_action('wp_footer', function () {
    ?>
    <!-- ===== START: FLOATING CHAT WIDGET (expandable/collapsible) =====
         Copy everything between the START and END markers into the target page's <body>.
         Also required on the target page:
           - ./chat-widget.css  (chat-toggle, chat-panel, messages, etc.)
           - The scripts at the bottom of this file (directline.js, marked.min.js, config.js, app.js)
         Contains: launcher button (#chatToggle) + expandable chat panel (#chatPanel). -->
    <button id="chatToggle" class="chat-toggle" aria-expanded="false" aria-controls="chatPanel" aria-label="Open ocpf chat">
      <span class="chat-toggle__icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img" focusable="false">
          <defs>
            <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4A90E2"></stop>
              <stop offset="100%" stop-color="#357ABD"></stop>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="#002244"></circle>
          <rect x="16" y="18" width="32" height="28" rx="8" fill="url(#botGrad)"></rect>
          <circle cx="25" cy="31" r="3" fill="#ffffff"></circle>
          <circle cx="39" cy="31" r="3" fill="#ffffff"></circle>
          <path d="M24 39c2.1 2.2 4.9 3.3 8 3.3s5.9-1.1 8-3.3" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"></path>
          <rect x="28" y="12" width="8" height="6" rx="3" fill="#ffffff"></rect>
        </svg>
      </span>
      <span id="chatToggleLabel">Chat with ocpf</span>
      <svg class="chat-toggle__close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"></path></svg>
    </button>

    <aside id="chatPanel" class="chat-panel" aria-label="ocpf chat window" hidden>
      <header class="chat-panel__header">
        <div class="chat-panel__title-wrap">
          <span class="chat-panel__icon" id="chatHeaderIcon" aria-hidden="true"></span>
          <div>
            <h3 id="chatTitle">ocpf Assistant</h3>
            <div class="chat-panel__status">
              <span class="connection-dot" id="connectionDot" aria-hidden="true"></span>
              <p id="connectionText">Connecting...</p>
            </div>
          </div>
        </div>
        <div class="chat-panel__actions">
          <button id="chatRestart" class="chat-restart" type="button" aria-label="Start a new chat" title="Start a new chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 4v5h-5"></path></svg>
          </button>
          <button id="chatClose" class="chat-close" type="button" aria-label="Close chat">✕</button>
        </div>
      </header>

      <div id="chatStatus" class="chat-status" role="status" aria-live="polite"></div>

      <section id="messages" class="messages" aria-live="polite" aria-label="Conversation messages">
        <div id="typingIndicator" class="typing" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </section>

      <div id="suggestedActions" class="suggested-actions" aria-label="Suggested actions"></div>

      <div id="attachmentList" class="attachment-list" aria-label="Files to send"></div>

      <form id="messageForm" class="chat-input" autocomplete="off">
        <label for="messageInput" class="visually-hidden">Type your message</label>
        <input id="messageInput" name="message" type="text" placeholder="Type your message" disabled />
        <input id="fileInput" type="file" multiple class="visually-hidden" tabindex="-1"
               accept=".docx,.csv,.pdf,.txt,.jpg,.jpeg,.png,.webp,.gif" />
        <button id="attachButton" type="button" aria-label="Attach a file" title="Attach a file" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.2a1.5 1.5 0 0 1-2.1-2.1L16 7.7"></path></svg>
        </button>
        <span class="chat-input__divider" aria-hidden="true"></span>
        <button id="sendButton" type="submit" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3 4l18 8-18 8 3-8-3-8z"></path><path d="M6 12h15"></path></svg>
        </button>
      </form>
    </aside>
    <!-- ===== END: FLOATING CHAT WIDGET (expandable/collapsible) ===== -->
    <?php
});
```

### 4) WordPress notes

- `get_stylesheet_directory_uri()` points at the child theme, so paths resolve correctly.
- If you use a caching plugin or CDN, purge caches after uploading.
- Some themes already print a `<button id="chatToggle">`-style element; if ids collide,
  rename them consistently in both the HTML and `app.js`.

---

## Other platforms

Any CMS or framework that lets you add a stylesheet, custom HTML and script tags works
the same way (Drupal, Joomla, Umbraco, Webflow, HubSpot, React/Angular/Vue app shells,
ASP.NET/Blazor layouts, Power Pages…). See "Supported website types" in
`CONFIGURATION.md` §1. SharePoint Online modern pages block custom script — use Copilot
Studio's SharePoint channel or an SPFx web part there.

## Troubleshooting

See `CONFIGURATION.md` §8. The most common embedding mistakes:

- **Widget never appears / console shows `Cannot read properties of null`** — an element
  id from the widget block is missing or was renamed. Re-copy the block from `index.html`.
- **"Direct Line primary secret is missing"** — `config.js` isn't loading (check the
  script path in DevTools → Network) or the secret is empty.
- **Online, but no greeting and no replies** — the agent is a new experience agent (GitHub
  Copilot harness), which Direct Line doesn't serve yet (as of October 8, 2026). Use the
  iframe embed for it, or a classic experience agent. See the note at the top.
- **Robot icon instead of yours** — `launcherIconUrl` path is wrong relative to the page.
- **Wrong font** — `fonts/` folder isn't next to `chat-widget.css`.

## Security note

`config.js` exposes the Direct Line secret to anyone who views source. Fine for demos and
internal sites; for public production, generate tokens server-side and point
`tokenGenerationEndpoint` at your own endpoint.
