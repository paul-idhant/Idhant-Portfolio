# Idhant’s portfolio — final package

A personalized version of the supplied reference website. The original monochrome visual style, decorative graphics, fonts, loading sequence, 3D PSP model, CRT effects, background music and invert control are retained. Idhant’s name, bio, photos, Instagram and SignBridge project replace or extend the reference content; the site is personalized, not a pixel-identical reproduction of its text and layout.

## Quick start

1. Extract the ZIP.
2. Open a terminal inside the `idhant-portfolio` folder.
3. Run:

```sh
python3 -m http.server 8001
```

On Windows, use `py -m http.server 8001` if needed.

4. Open **http://localhost:8001**.

Do not double-click `index.html`: browser security rules prevent the 3D model and JavaScript modules from loading correctly through `file://`. A local HTTP server or static website host is required. No build step, npm install or backend is needed.

## Included

- Personalized introduction and the complete supplied About Me text
- Three supplied photographs, responsive and click-to-enlarge
- SignBridge with live and repository links
- Instagram: https://www.instagram.com/paul_idhant/
- Three supplied videos in the interactive PSP
- The original reference site's exact `theme.mp3` soundtrack
- Original artwork, model, typography and visual effects
- Locally bundled Three.js and required modules; no CDN dependency

## Video controls

- Click/tap the PSP D-pad, or use **left/right arrow keys**, to browse.
- Click the screen, **X**, **Start**, the **↗ link**, or press **Enter** to open the complete clip in a new tab.
- Drag the PSP to rotate it.
- Square / Home / Select returns to About Me.

The PSP uses six-second, muted previews starting 0.5 seconds into each supplied clip, as in the reference design. Background music stays separate from video sound. The complete clips retain their original sound. Both the previews and complete clips are bundled in this package; Drive access is not needed to use the website.

Order follows the supplied archive:

| Source | Display label | Complete clip | Preview |
| --- | --- | --- | --- |
| 4.mp4 | On the pitch | assets/videos/video-01.mp4 | assets/reels/video-01.mp4 |
| 5.mp4 | In transit | assets/videos/video-02.mp4 | assets/reels/video-02.mp4 |
| 6.mp4 | After hours | assets/videos/video-03.mp4 | assets/reels/video-03.mp4 |

These are descriptive labels, editable in `js/data.js`. The first clip is portrait, with its original rotation metadata respected; the other two are landscape. Complete clips are about 9.88, 20.83 and 21.13 seconds. The first is remuxed without re-encoding; the others are optimized H.264/AAC copies. Nothing is cropped to fit the PSP screen.

## Music

The original soundtrack is included byte-for-byte. Most browsers block audible autoplay until a visitor taps, clicks or presses a key. Music starts after an allowed interaction and can be toggled using **music on/off**. The preference is remembered for the session. Music pauses while the tab is hidden. Autoplay restrictions cannot be overridden by the website.

## Photos

- 1.jpg → candid photo print in About Me
- 2.jpg → trophy photo print in About Me, with subtle CSS desaturation
- 3.jpg → SignBridge workspace photograph

Tap a photo for the enlarged viewer. Left/right arrows navigate, Escape closes, and focus returns to the selected photo. Original photo content and watermarks are preserved. The photographs are not inverted with the decorative artwork.

## Hosting

Upload everything **inside** this folder to a static website host, keeping all relative paths unchanged. `index.html` belongs at the site root. There is no build command. For smooth seeking in full videos, use a host supporting standard HTTP byte-range requests.

## Files to edit

- `index.html`: personal text and social/project links
- `css/style.css`: visual styles
- `js/data.js`: PSP video list
- `assets/photos/`: optimized photographs
- `assets/reels/`: muted PSP previews
- `assets/videos/`: complete clips with sound
- `assets/audio/theme.mp3`: original soundtrack

## Attribution / before public publication

Adapted from https://github.com/shutterkif-oss/shutterkif-oss.github.io . No license file was present at the reference repository root when inspected. Confirm permission to publicly reuse its code and retained artwork, fonts, soundtrack and 3D model, or replace them with licensed assets. This package does not grant rights to third-party materials. The bundled Three.js license is in `vendor/three/LICENSE`.

## Verification

Tested in Chromium at 1440×900 and 390×844:

- All three PSP previews load and play.
- Arrow-key selection and wraparound work.
- Enter opens the complete selected clip.
- All three complete video files decode and play.
- Background audio starts on interaction; off/on controls work.
- Invert control works; no horizontal page overflow.
- No failing resource responses or page JavaScript errors during these tests.
- Photo loading and keyboard-accessible enlarged viewing were also tested on desktop and mobile layouts.

Real-device iOS/Android testing and public deployment have not been performed.
