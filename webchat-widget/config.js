/*
  ocpf Direct Line configuration.
  Primary secret is used first; secondary secret is optional fallback.
*/
window.ocpfConfig = {
  // Title shown in the chat window header (next to the icon).
  chatTitle: "OnlyCopilotFans Assistant",

  // Placeholder text shown in the message box before the user types.
  inputPlaceholder: "Type your message",

  // Icon shown on the launcher button and in the chat window title bar.
  // Path or URL to a 136x136 image (see images/README.md). "" = built-in robot icon.
  launcherIconUrl: "images/chat-icon.png",

  // Launcher button color (any CSS color, e.g. "#3b8ad9"). A darker shade is
  // generated automatically for the gradient.
  launcherColor: "#3b8ad9",

  // Background color of the message box where the visitor types (any CSS color).
  // Keep it light: the text and placeholder colors do not change with it.
  inputBoxColor: "#ffffff",

  // Launcher button size:
  //   "full"    - icon + "Chat with ocpf"   (default; "Close chat" when open)
  //   "compact" - icon + "Chat"                ("Close" when open)
  //   "icon"    - round button, icon only      (X when open)
  //   "fulltext"    - "Chat with ocpf", no icon
  //   "compacttext" - "Chat", no icon
  launcherStyle: "full",

  // Launcher button text when the chat is closed.
  launcherLabelFull: "Chat with OnlyCopilotFans",   // used by "full" and "fulltext"
  launcherLabelCompact: "Chat",          // used by "compact" and "compacttext"

  // Text size for the whole chat widget (launcher, header, messages, input, buttons).
  // 0 = default. Positive values enlarge, negative shrink, in pixels: +1, -1, +2 ...
  // Recommended range -5 to +5.
  fontSizeAdjust: -1,

  // Corner the launcher is pinned to: "bottom-right" (default) or "top-right". The
  // floating chat window opens next to it (above or below the button).
  launcherPosition: "bottom-right",

  // Move the launcher (and the chat window with it) away from the corner, in pixels:
  // launcherOffsetUp moves it up from the bottom edge (or down from the top edge with
  // "top-right"), launcherOffsetLeft moves it left from the right edge. Useful when a
  // cookie banner or another button sits in the corner. For default position, set both to "0".
  launcherOffsetUp: 20,
  launcherOffsetLeft: 20,

  // ---- Chat window layout ------------------------------------------------------
  // How the chat window opens when the launcher is pressed:
  //   "floating"   - a window next to the launcher in its corner (default): above it at
  //                  the bottom, below it with launcherPosition "top-right"
  //   "sidecar"    - a panel docked to the right edge, the full height of the browser
  //                  window, like Copilot in Edge or in the Office apps
  //   "fullscreen" - covers the whole browser window (or the size set below)
  displayMode: "floating",

  // Sidecar width: a number in pixels (420) or a CSS size as text ("30%", "25vw").
  sidecarWidth: 420,
  // Let the visitor make the sidecar wider by dragging its left edge (or focusing the
  // edge and pressing the arrow keys). false = fixed width.
  sidecarResizable: true,
  // true = push the page content to the left so the sidecar does not cover it (like
  // Copilot in Edge). false = the sidecar lies over the page.
  sidecarPushPage: false,

  // Fullscreen size: "100%" fills the browser window. Smaller sizes, as a percentage of
  // the window ("80%") or in pixels (900), are centred over a dimmed page; clicking the
  // dimmed area closes the chat.
  fullscreenWidth: "100%",
  fullscreenHeight: "100%",

  // X button at the top right of the chat window. false hides it; the launcher button
  // then stays visible on top of the chat window as the way back to the page. The
  // Escape key closes the window in every case.
  closeButton: true,

  // true = the chat window is already open when the page loads. Useful with "sidecar"
  // or "fullscreen" on a page dedicated to the chat.
  openOnLoad: false,

  // ---- Optional features -------------------------------------------------------
  // These only add the controls to the chat window. The AGENT must support them too:
  //   * In Copilot Studio open the agent > Settings > Generative AI and turn on
  //       - "File uploads"                             (for fileUploads)
  //       - "Collect user reactions to agent messages" (for feedbackButtons)
  //   * If you change either setting, PUBLISH the agent again or it has no effect.
  // See CONFIGURATION.md for details.

  // Paperclip button for attaching files to a message. true = show, false = hide.
  fileUploads: true,

  // Thumbs up / thumbs down under agent replies:
  //   "auto"   - show when the agent marks a reply as accepting feedback (default)
  //   "always" - show under every agent reply
  //   "never"  - hide
  feedbackButtons: "auto",

  // Direct Line secrets: Copilot Studio > agent > Settings > Security > Web channel security.
  // As of October 8, 2026 Direct Line is only available for classic experience agents
  // (standard harness). New experience agents (GitHub Copilot harness) accept the secret
  // and show "Online" but never reply; use the iframe embed for those until Direct Line
  // supports them. See CONFIGURATION.md §3.
  directLine: {
    primarySecret: "Arm5fKm7GJnd9s9U1MkfyMGoFKZ1vy5pUYpkPH6HoRwpZc8D0ZlDJQQJ99CIACL93NaAArohAAABAZBS3BWq.8nwboTbYt0WGS5yEhI1yYy7UFjrk5U5OqK70jrRC8lNBQYUdTyogJQQJ99CIACL93NaAArohAAABAZBS4dF2",
    secondarySecret: "Arm5fKm7GJnd9s9U1MkfyMGoFKZ1vy5pUYpkPH6HoRwpZc8D0ZlDJQQJ99CIACL93NaAArohAAABAZBS3BWq.3dTbd9wyuZI732jHY6SKbKIOtcLoHfUXaKObXrLzLu9bLStAJw25JQQJ99CIACL93NaAArohAAABAZBS2KgN",
    tokenGenerationEndpoint: "https://directline.botframework.com/v3/directline/tokens/generate",
    domain: "https://directline.botframework.com/v3/directline",
    locale: "en-US"
  }
};
