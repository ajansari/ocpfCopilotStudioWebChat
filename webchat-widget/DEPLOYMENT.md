# ocpf Direct Line Deployment Guide

## 1) Overview of the Solution

This project is a **portable static website** that embeds a **Copilot Studio agent (ocpf)** through **Microsoft Bot Framework Direct Line**.

Key characteristics:
- Works with **classic experience agents (standard harness)**. As of October 8, 2026, Direct
  Line is not yet available for **new experience agents (GitHub Copilot harness)**; those
  need the iframe embed for now (`IframeVersion.html`). See §4 and §7.
- No framework dependency (plain HTML/CSS/JavaScript)
- Floating chat launcher (five styles: full, compact, icon, text-only variants) +
  expandable chat panel with a restart (new conversation) button
- Three display modes for the chat panel (`displayMode` in `config.js`): floating window
  in the corner, full-height sidecar docked to the right edge (resizable by dragging, can
  push the page content aside), or fullscreen (whole window or a configured width/height)
- Light theme with a blue accent (`#3b8ad9`), configurable via `launcherColor` in
  `config.js` and the CSS variables at the top of `chat-widget.css`
- Segoe UI everywhere: local font on Windows, Microsoft's font CDN elsewhere, Selawik
  from `fonts/` as an automatic fallback
- Optional file uploads (paperclip) and thumbs up/down feedback, each switchable in
  `config.js` and requiring the matching Copilot Studio agent setting
- DirectLineJS integration with:
  - Token generation via Direct Line secret
  - Secret-1 primary + Secret-2 fallback strategy
  - Connection-state handling
  - Greeting trigger (`startConversation`)
  - Typing indicator, suggested actions, markdown rendering, citation links
- `IframeVersion.html`: the same placeholder page with Copilot Studio's own iframe
  web chat instead of the custom widget, for side-by-side comparison

---

## 2) Reference Repo Review (Microsoft Sample)

Reference reviewed:
`https://github.com/microsoft/CopilotStudioSamples/tree/main/ui/custom-ui/directline-js`

### Repo structure (sample folder)
- `index.html`
  - Single-file implementation containing UI, styles, and JavaScript logic
- `config.sample.js`
  - Template for token endpoint configuration
- `config.js` (local-only in sample workflow)
  - Actual runtime configuration (not committed)

### Implementation approach used by Microsoft sample
1. Acquire connection credentials (token + endpoint metadata)
2. Create `DirectLine.DirectLine(...)`
3. Subscribe to `connectionStatus$`
4. Send `startConversation` event when online
5. Subscribe to `activity$`, filter bot messages, dedupe activities
6. Render markdown responses and citations
7. Handle suggested actions and typing events

### How this project adapts that approach
- Keeps the same robust activity/connection lifecycle model
- Uses **Direct Line secret-driven token generation** (no backend required)
- Splits code into production-friendly files (`index.html`, `chat-widget.css`, `app.js`, `config.js`)
- Adds responsive floating widget behavior and branded design system

---

## 3) File Structure Explanation

```text
README.md                     # Quick start (repo root)
webchat-widget/
├── index.html                # Placeholder page + the floating chat widget block
├── IframeVersion.html        # Same page with the Copilot Studio iframe web chat (comparison only)
├── index-interactive.html    # Interactive demo: try settings, download a ready-made package
├── chat-widget.css           # All widget styles (scoped to the widget)
├── styles.css                # Placeholder page styles only
├── interactive.js, interactive.css   # Interactive demo only
├── app.js                    # Direct Line integration + chat behaviour
├── config.js                 # Your settings + secrets
├── config.sample.js          # Template for config.js
├── images/
│   ├── chat-icon.png         # Launcher / title-bar icon (required)
│   ├── README.md             # Icon requirements
│   └── favicon.png, onlycopilotfans-logo.png, copilot-studio-icon.png   # placeholder page only
├── fonts/                    # Selawik fallback fonts (required)
├── CONFIGURATION.md          # Full settings + embedding manual
├── EMBEDDING_INSTRUCTIONS.md # Step-by-step embedding (static HTML, WordPress)
├── DEPLOYMENT.md             # This guide
└── *.pdf                     # Older exports of the .md files — the .md versions are authoritative
```

---

## 4) Configure for a New Agent

For a new Copilot Studio agent, update only `config.js` (or regenerate from `config.sample.js`).

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

Required values:
- `directLine.primarySecret`
- `directLine.secondarySecret` (optional but recommended)

Both come from Copilot Studio → agent → Settings → Security → Web channel security. The
**Require secured access** switch there is recommended but optional: the widget presents a
secret on every token request, so it works with the switch on or off; on simply rejects
Direct Line callers that have no secret.

Appearance and features (optional) — all documented in `CONFIGURATION.md` §3:
- `chatTitle` - title in the chat window header
- `inputPlaceholder` - placeholder text in the message box
- `launcherIconUrl` - launcher/title-bar icon (136x136, see `images/README.md`)
- `launcherColor` - launcher button colour
- `launcherStyle` - `full` | `compact` | `icon` | `fulltext` | `compacttext`
- `launcherLabelFull` / `launcherLabelCompact` - launcher button text (closed state)
- `launcherPosition` - `bottom-right` | `top-right`
- `launcherOffsetUp` / `launcherOffsetLeft` - move the widget away from the corner (px)
- `fontSizeAdjust` - widget text size, 0 = default, e.g. +1 / -1 (recommended -5..+5)
- `displayMode` - `floating` | `sidecar` | `fullscreen`
- `sidecarWidth` / `sidecarResizable` / `sidecarPushPage` - sidecar width (px or %), drag-to-resize, push page content
- `fullscreenWidth` / `fullscreenHeight` - fullscreen size (`"100%"`, `"80%"`, or px)
- `closeButton` - X at the top right of the chat window (`true` / `false`)
- `openOnLoad` - open the chat window when the page loads (`true` / `false`)
- `fileUploads` - paperclip button (agent needs File uploads on, then re-publish)
- `feedbackButtons` - thumbs up/down: `auto` | `always` | `never` (agent needs user reactions on)

Optional values:
- `directLine.tokenGenerationEndpoint` (default: `https://directline.botframework.com/v3/directline/tokens/generate`)
- `directLine.domain` (default: `https://directline.botframework.com/v3/directline`)
- `directLine.locale`

All visible widget text is now set in `config.js`; see `CONFIGURATION.md` §5 for the
few remaining accessibility labels in `index.html`.

---

## 5) Step-by-Step Deployment Instructions

### A. Local validation
1. Open terminal in project folder.
2. Serve static files:
   - Python: `python3 -m http.server 8080`
   - or Node: `npx serve . -l 8080`
3. Browse to `http://localhost:8080`.
4. Open chat launcher and verify:
   - Connection becomes Online
   - Greeting appears
   - Message send/receive works

### B. Deploy to web server
1. Copy the files in the "Files to deploy" checklist in `CONFIGURATION.md` §1 to your
   target host (IIS, Nginx, Apache, Static Web Apps, S3+CloudFront, etc.): `chat-widget.css`,
   `app.js`, `config.js`, `images/chat-icon.png`, `fonts/`. Add `index.html` only if you
   want the placeholder page itself; otherwise embed the widget block in your own pages
   (`EMBEDDING_INSTRUCTIONS.md`).
2. Ensure the host serves `.js`, `.css`, `.png` and `.woff2` as static assets.
3. Confirm HTTPS is enabled (Direct Line is HTTPS-only; browsers block mixed content).
4. Load the deployed URL and validate chat interaction end-to-end, including file upload
   and thumbs feedback if enabled.

### C. Production hardening (recommended)
For security, do **not** expose Direct Line secrets in client-side JavaScript.

Production pattern:
1. Move token generation to a backend endpoint you control.
2. Backend uses secret to call Direct Line token API.
3. Frontend requests short-lived token from your backend.
4. Frontend never receives/stores raw secret.

---

## 6) Effort Estimate for Deploying Additional Agents

### Typical effort (per additional agent)
- Basic clone + config swap + text updates: **30–60 minutes**
- With brand/theme customization and QA: **2–4 hours**
- With backend token broker + security review + release pipeline: **0.5–1.5 days**

### Effort drivers
- Number of environments (dev/test/prod)
- Branding complexity
- Security/compliance requirements
- Need for analytics/telemetry and monitoring

---

## 7) Troubleshooting Tips

### Online, but no greeting and no replies
- The agent is a new experience agent (GitHub Copilot harness). As of October 8, 2026,
  Direct Line is only available for classic experience agents (standard harness): the
  token and WebSocket succeed, but nothing is served behind them. Use the iframe embed
  for that agent, or a classic experience agent with this widget. See §4.

### Chat stuck on “Connecting...”
- Verify `primarySecret` value in `config.js`
- Confirm Direct Line channel is enabled for the agent
- Check browser console for token request failures

### 401/403 from token generation endpoint
- Secret is invalid/rotated or from wrong bot
- Regenerate secret in Copilot Studio channel settings
- Update `config.js` with new secret

### Messages not rendering
- Ensure both script dependencies load:
  - `botframework-directlinejs`
  - `marked`
- Check console for JS errors

### Duplicate bot messages
- Ensure dedup logic remains in `app.js` (`seenActivityIds`)

### Suggested actions do not appear
- Verify agent actually sends `suggestedActions` for that topic

### "Session expired" / conversation ended
- Click the ↻ (restart) button in the chat header to start a new conversation without
  reloading the page

### Paperclip or thumbs up/down missing, or agent ignores them
- See `CONFIGURATION.md` §6: both the `config.js` toggle and the Copilot Studio agent
  setting must be on, and the agent must be re-published after changing the setting

### Mobile layout issues
- Confirm viewport meta tag is present (`index.html`)
- Keep `chat-widget.css` responsive media queries intact

---

## 8) Security Notes

Current project includes secrets in `config.js` because the requested deliverable is a fully runnable portable package.

For production, treat this as a bootstrap/demo baseline and migrate to a backend token broker before public release.
