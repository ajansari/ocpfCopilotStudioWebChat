# Launcher icon (chat button image)

The round icon on the floating launcher button and in the chat window title bar. If you don't set one,
the built-in robot icon is used.

## How to change it

1. Save your image in this folder, e.g. `images/chat-icon.png`.
2. Open `config.js` and set:

   ```js
   launcherIconUrl: "images/chat-icon.png",
   ```

3. Reload the page (hard refresh, Ctrl/Cmd+Shift+R, if the old icon is cached).

To go back to the robot, set `launcherIconUrl: ""`.
If the image can't be loaded (wrong path, missing file), the robot is shown instead
and a warning appears in the browser console.

## Image requirements

| Item        | Recommendation                                                    |
|-------------|-------------------------------------------------------------------|
| Dimensions  | **136 × 136 px**, square (displays at ~34 px; 4x keeps it sharp)  |
| Minimum     | 68 × 68 px                                                        |
| Format      | PNG (transparent OK), JPG, WebP, or SVG (SVG scales to any size) |
| File size   | Under ~50 KB                                                      |
| Shape       | Shown in a circle, so corners are cropped; keep the subject centered with a little padding |

Non-square images are cropped to fill the circle (`object-fit: cover`), so crop to
a square first.

## Path notes

- `images/chat-icon.png` is relative to the page (`index.html`) that loads the widget.
- When the widget is embedded in another site, use an absolute URL, e.g.
  `https://yoursite.com/assets/chat-icon.png`, or a root path like `/assets/chat-icon.png`.
- Remote images must be publicly reachable. Cross-origin hosting is fine (no CORS
  setup needed for an `<img>`).

## Changing the display size

Edit `width` / `height` on `.chat-toggle__icon` in `styles.css` (default `2.1rem`;
the `icon` launcher style uses `2.5rem` via `.chat-toggle--icon .chat-toggle__icon`),
and export the image at about 4x that size.
