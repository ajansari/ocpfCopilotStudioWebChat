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

  // Move the launcher (and the chat window with it) away from the bottom-right corner,
  // in pixels. Useful when a cookie banner or another button sits in the corner.
  // For default position, set both properties below to "0".
  launcherOffsetUp: 20,
  launcherOffsetLeft: 20,

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

  directLine: {
    primarySecret: "Arm5fKm7GJnd9s9U1MkfyMGoFKZ1vy5pUYpkPH6HoRwpZc8D0ZlDJQQJ99CIACL93NaAArohAAABAZBS3BWq.8nwboTbYt0WGS5yEhI1yYy7UFjrk5U5OqK70jrRC8lNBQYUdTyogJQQJ99CIACL93NaAArohAAABAZBS4dF2",
    secondarySecret: "Arm5fKm7GJnd9s9U1MkfyMGoFKZ1vy5pUYpkPH6HoRwpZc8D0ZlDJQQJ99CIACL93NaAArohAAABAZBS3BWq.3dTbd9wyuZI732jHY6SKbKIOtcLoHfUXaKObXrLzLu9bLStAJw25JQQJ99CIACL93NaAArohAAABAZBS2KgN",
    tokenGenerationEndpoint: "https://directline.botframework.com/v3/directline/tokens/generate",
    domain: "https://directline.botframework.com/v3/directline",
    locale: "en-US"
  }
};
