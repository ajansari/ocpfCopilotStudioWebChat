# Configuration Manual — Copilot Studio Web Chat Widget

An expand/collapse chat window for a Microsoft Copilot Studio agent, built on Direct Line
with plain HTML, CSS and JavaScript. No framework, no build step. The window opens floating
in the corner, as a full-height sidecar on the right, or fullscreen (§5a).

This manual covers everything you can change and where to change it. Nothing here
requires editing `app.js`.

---

## 1. What's in the folder

| File / folder | Purpose | Needed on your site? |
|---|---|---|
| `index.html` | Demo page **plus** the chat widget markup | Copy the widget section only (see §2) |
| `chat-widget.css` | All chat widget styles (scoped to the widget; includes the Segoe UI font rules) | Yes |
| `styles.css` | Demo page styles only (logo, cards, footer) | No |
| `index-interactive.html`, `interactive.js`, `interactive.css` | Interactive demo: try settings live and download a ready-made package | No |
| `app.js` | Chat logic (Direct Line connection, messages, uploads, feedback) | Yes |
| `config.js` | **Your settings** — secrets, icon, colour, feature toggles | Yes |
| `config.sample.js` | Template for `config.js` with placeholder values | No |
| `images/chat-icon.png` | Icon for the launcher button and chat title bar | Yes (or your own) |
| `images/README.md` | Icon size and format requirements | No |
| `fonts/` | Selawik (Segoe UI stand-in) used if Microsoft's font CDN is unreachable | Yes |
| `images/favicon.png`, `images/onlycopilotfans-logo.png`, `images/copilot-studio-icon.png` | Demo page only | No |
| `CONFIGURATION.md` (this file), `DEPLOYMENT.md`, `EMBEDDING_INSTRUCTIONS.md` (and `README.md` in the repo root) | Documentation | No |

### Files to deploy — checklist

Copy these to your web server, keeping them together in one folder (e.g. `/chat-widget/`):

```
chat-widget/
├── chat-widget.css
├── app.js
├── config.js              ← your secrets and settings
├── images/
│   └── chat-icon.png      ← or your own icon (see §4)
└── fonts/
    ├── selawk.woff2
    ├── selawksl.woff2
    ├── selawksb.woff2
    └── SELAWIK-LICENSE.txt
```

Two libraries load from public CDNs and do **not** need to be copied:
`botframework-directlinejs` (unpkg) and `marked` (jsDelivr). If your site can't reach
those CDNs, download both files, host them alongside `app.js`, and change the two
`<script src>` URLs.

`index.html` is a demo page; you take the widget block out of it (§2) rather than
deploying the file itself.

### Supported website types

The widget is plain HTML + CSS + JavaScript with no build step and no server code, so it
runs anywhere a page can load a stylesheet and a few script tags:

| Website type | How |
|---|---|
| Static sites — IIS, Nginx, Apache, Azure Static Web Apps, Azure Blob static hosting, GitHub Pages, Netlify, Vercel, S3 + CloudFront, any CDN | Upload the folder above; paste the widget block into each page (§2). |
| WordPress | Put the folder in a **child theme**, enqueue the CSS/JS in `functions.php`, and output the widget block from a `wp_footer` action. Step-by-step in `EMBEDDING_INSTRUCTIONS.md`, Option 2. |
| Other CMSs (Drupal, Joomla, Umbraco, Sitecore, Webflow, Squarespace, Wix, HubSpot…) | Any CMS that lets you add custom HTML + `<script>` tags to the page or a site-wide footer. Host the folder on the CMS or any static host and reference it by absolute URL. |
| Frameworks (React, Angular, Vue, Blazor, ASP.NET, Razor Pages, PHP, Django, Rails…) | Add the stylesheet and scripts to the app shell / layout template and render the widget block once. `app.js` is a self-contained IIFE that only touches its own element IDs. |
| Power Pages | Add the widget block and script references to the site's header/footer web template; host the files as web files. |
| SharePoint Online modern pages | **Not supported as-is** — modern pages block custom script. Use Copilot Studio's SharePoint channel or an SPFx web part instead. |

Requirements on the host: serve `.css`, `.js`, `.png` and `.woff2` as static files with
correct MIME types (all common servers do by default), and HTTPS (Direct Line is HTTPS
and browsers block mixed content).

> **GitHub Pages / any public repo:** `config.js` contains your Direct Line secret. Don't
> commit it to a public repository; see the security note in §3.

---

## 2. Putting the widget on your own page

`index.html` contains three clearly marked blocks. Open it and look for the comments:

```html
<!-- ===== START: PLACEHOLDER PAGE ... =====            (demo content — do NOT copy)
<!-- ===== END: PLACEHOLDER PAGE =====

<!-- ===== START: FLOATING CHAT WIDGET ... =====        (copy this whole block)
<!-- ===== END: FLOATING CHAT WIDGET ... =====

<!-- ===== START: CHAT WIDGET SCRIPTS ... =====         (copy this whole block)
<!-- ===== END: CHAT WIDGET SCRIPTS =====
```

Steps:

1. Copy `chat-widget.css`, `app.js`, `config.js`, `images/chat-icon.png` and the `fonts/` folder
   to a folder on your site, e.g. `/chat-widget/`.
2. In the `<head>` of your page add:
   ```html
   <link rel="stylesheet" href="/chat-widget/chat-widget.css" />
   ```
3. Paste the **FLOATING CHAT WIDGET** block anywhere inside `<body>` (just before
   `</body>` is fine — the widget is position-fixed, so placement doesn't matter).
4. Paste the **CHAT WIDGET SCRIPTS** block just before `</body>`, after the widget block,
   and fix the two relative paths (`./config.js`, `./app.js`) to match your folder:
   ```html
   <script src="https://unpkg.com/botframework-directlinejs/dist/directline.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
   <script src="/chat-widget/config.js"></script>
   <script src="/chat-widget/app.js"></script>
   ```
5. In `config.js`, make `launcherIconUrl` point to where you put the icon (see §4).

The widget styles all start with `.chat-`, `.message`, `.feedback`, `.attachment` or
`.typing`, so they are unlikely to collide with your site's CSS, and `chat-widget.css`
contains nothing that touches your page's `body`, fonts or layout. The widget always
renders in Segoe UI (see §5) regardless of the host page's font. `styles.css` is the demo
page only; you don't need it.

---

## 3. `config.js` reference

Start from `config.sample.js` if you don't have a `config.js` yet.

```js
window.ocpfConfig = {
  chatTitle: "ocpf Assistant",
  inputPlaceholder: "Type your message",
  launcherIconUrl: "images/chat-icon.png",
  launcherColor: "#3b8ad9",
  inputBoxColor: "#ffffff",
  launcherStyle: "full",
  launcherLabelFull: "Chat with ocpf",
  launcherLabelCompact: "Chat",
  launcherPosition: "bottom-right",
  launcherOffsetUp: 0,
  launcherOffsetLeft: 0,
  fontSizeAdjust: 0,
  displayMode: "floating",
  sidecarWidth: 420,
  sidecarResizable: true,
  sidecarPushPage: false,
  fullscreenWidth: "100%",
  fullscreenHeight: "100%",
  closeButton: true,
  openOnLoad: false,
  fileUploads: true,
  feedbackButtons: "auto",
  directLine: {
    primarySecret: "...",
    secondarySecret: "...",
    tokenGenerationEndpoint: "https://directline.botframework.com/v3/directline/tokens/generate",
    domain: "https://directline.botframework.com/v3/directline",
    locale: "en-US"
  }
};
```

| Setting | Values | What it does |
|---|---|---|
| `chatTitle` | text | Title in the chat window header, e.g. your agent's name. |
| `inputPlaceholder` | text | Placeholder shown in the message box before the user types. Default "Type your message". |
| `launcherIconUrl` | path or URL, or `""` | Image on the launcher button and in the chat title bar. `""` uses the built-in robot icon. See §4. |
| `launcherColor` | any CSS colour | Colour of the floating launcher button. A darker shade for the gradient is derived automatically. See §5. |
| `inputBoxColor` | any CSS colour | Background of the message box where the visitor types. Default white. Text and placeholder colours stay the same, so keep it light. |
| `launcherStyle` | `"full"` / `"compact"` / `"icon"` / `"fulltext"` / `"compacttext"` | Launcher size: icon + "Chat with ocpf"; icon + "Chat"; round icon-only button; "Chat with ocpf" with no icon; "Chat" with no icon. The open-state label follows ("Close chat" / "Close" / ✕). |
| `launcherLabelFull` | text | Launcher text (closed state) for the `full` and `fulltext` styles. |
| `launcherLabelCompact` | text | Launcher text (closed state) for the `compact` and `compacttext` styles. |
| `launcherPosition` | `"bottom-right"` / `"top-right"` | Corner the launcher is pinned to. The floating window opens above the button at the bottom, below it at the top. Sidecar and fullscreen are unaffected. |
| `launcherOffsetUp` | number (px) | Moves the launcher **and** the chat window away from the vertical edge: up from the bottom, or down from the top with `"top-right"`. `0` = default position. |
| `launcherOffsetLeft` | number (px) | Moves both left from the right edge. Use these to clear a cookie banner or another corner button. |
| `fontSizeAdjust` | number, `0` default | Added to every font size in the widget, in pixels: `1` or `+1` enlarges text by 1 px, `-1` shrinks it. Recommended range −5 to +5. Icon and button dimensions don't change. |
| `displayMode` | `"floating"` / `"sidecar"` / `"fullscreen"` | How the chat window opens: a window next to the launcher (above it, or below it with `launcherPosition: "top-right"`); a panel docked to the right edge, full height; or covering the browser window. See §5a. |
| `sidecarWidth` | number (px) or text (`"30%"`, `"25vw"`) | Width of the sidecar. Default `420`. |
| `sidecarResizable` | `true` / `false` | Lets the visitor stretch the sidecar by dragging its left edge (or focusing the edge and pressing the arrow keys). Minimum 300 px, maximum 90 % of the window. |
| `sidecarPushPage` | `true` / `false` | `true` pushes the page content left while the sidecar is open, like Copilot in Edge. `false` (default) lays the sidecar over the page. |
| `fullscreenWidth` / `fullscreenHeight` | `"100%"` or a size (`"80%"`, `900`) | Size of the fullscreen window. `"100%"` × `"100%"` fills the browser window; anything smaller is centred over a dimmed page. The window is modal: clicking the dimmed area closes it. |
| `closeButton` | `true` / `false` | The X at the top right of the chat window. With `false` the launcher stays visible on top of the open window as the way back to the page; Escape closes in every case. |
| `openOnLoad` | `true` / `false` | `true` opens the chat window as soon as the page loads. Meant for a page dedicated to the chat, usually with `sidecar` or `fullscreen`. |
| `fileUploads` | `true` / `false` | Shows/hides the paperclip button. **Agent setting required — see §6.** |
| `feedbackButtons` | `"auto"` / `"always"` / `"never"` | Thumbs up/down under agent replies. **Agent setting required — see §6.** |
| `directLine.primarySecret` | string | Direct Line **Secret 1** from Copilot Studio. Required. |
| `directLine.secondarySecret` | string or `""` | **Secret 2**, tried automatically if Secret 1 fails. Optional. |
| `directLine.tokenGenerationEndpoint` | URL | Leave as-is unless Microsoft tells you otherwise. |
| `directLine.domain` | URL | Leave as-is. |
| `directLine.locale` | e.g. `"en-US"` | Sent with the conversation-start event. |

### Where to get the secrets

Copilot Studio → your agent → **Settings** → **Security** → **Web channel security** →
copy **Secret 1** (and **Secret 2**). The agent must be **published**.

**Require secured access**, on the same page, is recommended but optional. The widget sends a
secret with every token request, so it works whether the switch is on or off. Turning it on
only closes the door to Direct Line callers that present no secret at all; turn it on unless
you need the agent reachable without one.

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

> **Security note.** Secrets in `config.js` are visible to anyone who views the page
> source. That is acceptable for demos and internal sites. For a public production site,
> generate Direct Line tokens on a server you control and point
> `tokenGenerationEndpoint` at it.

---

## 4. Chat icon

The same image is used in two places: the round icon on the launcher button (when the
chat is closed) and the icon left of the title in the chat window's header.

- **Size:** 136 × 136 px, square. It displays at about 34 px; 4× keeps it sharp on
  high-DPI screens. Minimum 68 × 68.
- **Format:** PNG (transparent OK), JPG, WebP or SVG.
- **Shape:** it is clipped to a circle, so keep the subject centred with a little margin.
- **Where:** save it in `images/` (or anywhere) and set `launcherIconUrl` to its path.
  When the widget lives on another site, use an absolute path or full URL.
- **Fallback:** if the file can't be loaded, the built-in robot icon is shown and a
  warning is written to the browser console.

Full details: `images/README.md`.

When the chat is **open**, the launcher hides the icon and shows a ✕ — with "Close chat"
for the `full`/`fulltext` styles, "Close" for `compact`/`compacttext`, and ✕ alone for `icon`.

---

## 5. Colours, text and size

### Launcher button colour
`launcherColor` in `config.js`. Nothing else needed.

### Message box colour
`inputBoxColor` in `config.js` sets the background of the box where the visitor types.
Text and placeholder colours don't change with it, so keep it light.

### Everything else — variables at the top of `chat-widget.css`

```css
:root {
  --accent: #3b8ad9;         /* default launcher colour, hover tints, links */
  --accent-dark: #2a6db5;    /* Submit button, selected thumb, link colour */
  --accent-soft: #eaf3fc;    /* user message bubble background, hover backgrounds */
  --accent-border: #c5dcf3;  /* user message bubble border, suggested-action pills */
  --border: #e1dfdd;         /* agent bubble border, header divider */
  --border-strong: #c8c6c4;  /* input box border */
  --text-primary: #0f172a;
  --text-muted: #6b6b6b;     /* status text, close/restart icons */
}
```

Change these and every part of the widget follows.

### Text labels (in the widget block of `index.html`)

| Text | Where |
|---|---|
| "Chat with ocpf" / "Chat" (launcher, closed) | `launcherLabelFull` / `launcherLabelCompact` in `config.js` |
| "Close chat" / "Close" (launcher, open) | `LAUNCHER_LABELS` near the top of `app.js` |
| "ocpf Assistant" (chat window title) | `chatTitle` in `config.js` |
| "Type your message" (message box placeholder) | `inputPlaceholder` in `config.js` |
| Accessibility labels | `aria-label` on `#chatToggle`, `#chatPanel`, `#chatClose`, `#chatRestart`, `#attachButton`, `#sendButton` |

### Size and position

These values apply to the floating window (`displayMode: "floating"`). The sidecar and
fullscreen sizes are set in `config.js`; see §5a.

In `chat-widget.css`, `.chat-panel`:

```css
width: min(390px, calc(100vw - 1rem));
height: min(680px, 74vh);      /* the window opens at this size */
right: 1.1rem;
bottom: 5.3rem;                /* sits above the launcher */
```

The launcher is `.chat-toggle` (`right: 1.1rem; bottom: 1.1rem`). Both have smaller
values in the `@media (max-width: 640px)` block for phones. To nudge everything away
from the corner without touching CSS, use `launcherOffsetUp` / `launcherOffsetLeft` in
`config.js`; to pin the launcher to the top-right corner instead, set
`launcherPosition: "top-right"` (the floating window then hangs below it, and
`launcherOffsetUp` moves both down from the top edge).

## 5a. Display mode: floating, sidecar or fullscreen

`displayMode` in `config.js` decides where the chat window opens. The launcher button, the
HTML block and everything inside the window stay the same; only the window's position and
size change. On phones (640 px and narrower) the sidecar and the fullscreen window both
fill the screen.

### `"floating"` (default)

A window next to the launcher in its corner: above it at the bottom-right, below it with
`launcherPosition: "top-right"`. Sized as described under "Size and position" above. The
launcher stays visible and reads "Close chat" while the window is open.

### `"sidecar"`

A panel docked to the right edge, the full height of the browser window, with the same
shadow and border as the "Try it yourself" drawer on the demo page: the way Copilot opens in
Edge and in the Office apps.

- **Width:** `sidecarWidth`, a number in pixels (`420`) or a CSS size as text (`"30%"`,
  `"25vw"`). Never narrower than 300 px, whatever the value.
- **Stretching:** with `sidecarResizable: true` the visitor can drag the sidecar's left edge
  to make it wider or narrower (300 px up to 90 % of the window). The edge is also keyboard
  operable: Tab to it and press ← / → (Shift for 50 px steps). The dragged width lasts until
  the page is reloaded; the next load starts from `sidecarWidth` again.
- **Page content:** `sidecarPushPage: true` moves the page content left by the sidecar's
  width while it is open, so nothing is hidden behind it. It does this by setting
  `padding-right` on `<body>` and restores the original value on close. It also sets the CSS
  variable `--chat-sidecar-push` on `<html>` (the sidecar width while open, `0px` otherwise)
  for pages that want to react in their own stylesheet. `false` (default) lays the sidecar
  over the page, which is the safe choice for layouts you don't control.
- **Closing:** the X at the top right of the sidecar, or Escape. The launcher hides while the
  sidecar is open and comes back when it closes.

### `"fullscreen"`

The chat covers the browser window as a modal dialog: the page behind is dimmed, cannot be
clicked or scrolled, and Tab stays inside the window. The X at the top right, Escape, or a
click on the dimmed area closes it and brings the page back exactly as it was.

- **Size:** `fullscreenWidth` and `fullscreenHeight`, each `"100%"` by default. Give either
  a smaller percentage (`"80%"`) or a number of pixels (`900`) and the window is centred over
  a dimmed page, with rounded corners and a shadow. At `100%` × `100%` it is edge to edge
  with no backdrop.
- **Closing:** the X, or Escape. The launcher hides while the window is open.
- A host page can keep a strip on the left free by setting the CSS variable
  `--chat-inset-left` on `<body>` (the demo page does this for its settings drawer). It is
  `0px` unless you set it.

### The X button and opening on load (every mode)

- `closeButton: false` removes the X from the title bar. So that the visitor can always get
  back to the page, the launcher button then stays visible on top of the open window (it
  reads "Close chat", "Close" or shows an X, following `launcherStyle`), and the message box
  (or, with `launcherPosition: "top-right"`, the title bar) moves out of its way. Escape
  still closes.
- `openOnLoad: true` opens the window as soon as the page loads, without a click on the
  launcher. Combine it with `sidecar` or `fullscreen` for a page dedicated to the chat.

### Fonts

The widget uses **Segoe UI**, resolved in this order automatically:

1. Segoe UI installed on the device (Windows)
2. Segoe UI web font from Microsoft's Fluent UI CDN
3. Selawik (Microsoft's open-source Segoe UI equivalent) from the `fonts/` folder

No configuration needed; just keep the `fonts/` folder alongside `chat-widget.css`.

---

## 6. Optional features: file uploads and thumbs up/down

Both features have two halves. `config.js` controls whether the **widget shows the
controls**; Copilot Studio controls whether the **agent accepts them**. Turning one on
without the other does nothing useful.

### Checklist for the agent maker

1. In Copilot Studio open the agent → **Settings** → **Generative AI**.
2. For file uploads: under **File processing capabilities**, turn on **File uploads**.
3. For thumbs up/down: under **User feedback**, make sure **Collect user reactions to
   agent messages** is on (it is on by default for new agents).
4. **Save**, then **Publish the agent again.** Settings changes do not reach the Direct
   Line channel until the agent is re-published.
5. Then set `fileUploads` / `feedbackButtons` in `config.js`.

### File uploads (`fileUploads: true`)

- A paperclip button appears in the input row. Users can attach one or more files; they
  show as chips above the input and are sent with the next message (a message can be
  files only, no text).
- Accepted types match what the agent can read: DOCX, CSV, PDF, TXT, JPG, PNG, WebP, GIF.
  Edit the `accept` attribute on `#fileInput` in `index.html` to change this.
- Files over 15 MB are refused with a status message (Copilot Studio's limit).
- Other agent-side limits: PDFs up to 40 pages; 30,000 characters of text per file
  unless the agent's code interpreter is on.
- Uploads go through Direct Line's standard upload endpoint via DirectLineJS; no extra
  endpoint or setting is needed.

### Thumbs up / down (`feedbackButtons`)

- `"auto"` — buttons appear under replies the agent flags as accepting feedback
  (`channelData.feedbackLoop`). This mirrors how Copilot Studio's own web chat decides.
- `"always"` — buttons under every reply. Use this if `"auto"` never shows them; that
  means the agent isn't flagging replies, but the reactions are still recorded.
- `"never"` — hidden.
- Clicking a thumb opens an optional comment box with **Skip** / **Submit**. Either sends
  the reaction (and comment) to the agent as a feedback activity, then locks the buttons.
- Reactions and comments appear in Copilot Studio under **Analytics** and in the
  conversation transcripts.

---

## 7. Other behaviour worth knowing

- **Restart (↻ in the header):** ends the Direct Line conversation, clears the
  transcript and queued files, and starts a fresh conversation with a new token. The
  greeting fires again.
- **Greeting:** on connect the widget sends a `startConversation` event, which triggers
  the agent's Conversation Start topic.
- **Suggested actions** from the agent render as pills above the input.
- **Markdown** in agent replies is rendered (via `marked`); links open in a new tab.
- **Citations** (`schema.org/Message` entities) render as a "Sources" list under the
  reply.
- **Escape** closes the chat window in every display mode. When the window closes, focus
  returns to the launcher button.
- **Secret fallback:** if Secret 1 is rejected, Secret 2 is tried automatically.

---

## 8. Troubleshooting

| Symptom | Check |
|---|---|
| "Direct Line primary secret is missing in config.js" | `config.js` isn't loading (path in the script tag) or `primarySecret` is empty. |
| "Connection failed" | Secret is wrong or the agent isn't published. Regenerate the secret in Copilot Studio and re-publish. |
| Green dot / "Online", but no greeting and no replies, even after typing a message | The agent is a **new experience agent (GitHub Copilot harness)**. As of October 8, 2026 Direct Line is only available for classic experience agents (standard harness); the token and socket succeed but nothing is served behind them. Use the iframe embed (`IframeVersion.html`) for that agent, or a classic experience agent with this widget. See §3. |
| Robot icon instead of my icon | `launcherIconUrl` path is wrong relative to the **page**, not to `config.js`. Check the browser console for the warning. |
| Paperclip / thumbs don't appear | `fileUploads` is `false` / `feedbackButtons` is `"never"`. For thumbs in `"auto"`, try `"always"`. |
| Files are sent but the agent ignores them | **File uploads** is off in the agent, or the agent wasn't re-published after turning it on. |
| Thumbs work but nothing shows in Analytics | **Collect user reactions** is off in the agent, or it wasn't re-published. Analytics can also lag by a few hours. |
| Wrong font on Mac/Linux | Fonts load from the Microsoft CDN, then `fonts/`. Make sure the `fonts/` folder was copied next to `chat-widget.css`. |
| Old icon/colour after a change | Hard-refresh (Ctrl/Cmd + Shift + R); browsers cache `config.js` and images. |
| Sidecar or fullscreen window opens as the small floating window | `displayMode` is misspelt (values are `"floating"`, `"sidecar"`, `"fullscreen"`), or an old `chat-widget.css` / `app.js` is cached. Both files must be the current version. |
| No drag handle on the sidecar | `sidecarResizable` is `false`, or the window is 640 px wide or narrower (the sidecar fills the screen there). |
| No X on the chat window | `closeButton` is `false`. The launcher stays on top as the way back; Escape also closes. |
