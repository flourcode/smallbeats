# Small Beats

**Make your own mixtape.** A tiny music machine at smallbeats.com: pick a sound, add a few parts, try another tune, put a sticker on the tape, name it, save it, send it. Whoever opens the link hears the tape and can remix it.

A static site: no server, no build step, no accounts. Upload the folder as is.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site: the machine, the cassette, your tapes, about |
| `app.js` | The machine, the tapes, stickers, sharing, the share picture, broadcast mode |
| `engine.js` | The music engine (`window.SBE`). Everything you hear is synthesized here, live |
| `stickers.png` | The sticker pack's `Static_Sheet.png`, 800 × 320, untouched |
| `stickers.js` | Sticker names, the ten categories (one per row) and the 16 quick picks |
| `app.css` | All styles |
| `analytics.js` | Google Analytics 4 (`G-QY4M7NZD76`). Empty the ID to switch it off |
| `privacy.html`, `terms.html`, `404.html` | The other pages |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline copy and home-screen install |
| `og.png` | The link preview image (1200 × 630) |
| `CNAME` | `smallbeats.com` (for GitHub Pages) |

## The loop

PICK → MIX → NEW TUNE → STICKER → NAME → SAVE → COPY LINK → (they) PLAY → REMIX → COPY LINK

- **▶ PLAY / ❚❚ PAUSE** sits next to the display. Pause really pauses (the tune picks up where it stopped). Touching any control also starts the music.
- **1 Pick a sound**: LO-FI, AMBIENT, HOUSE, 8-BIT, DUB. Each loads a starting recipe. Tapping the one already lit does nothing, so nobody loses their mix by accident.
- **2 Mix it**: DRUMS (on/off), BASS (warm, deep, synth), KEYS (Rhodes, guitar, pad, 8-bit), ATMOSPHERE (rain, ocean, fire), SPEED (slow, easy, fast). Lit means playing; tap a lit key to take that part out. Taking the drums out keeps the groove's tempo and feel.
- **NEW TUNE** keeps the parts and rolls a new seed: a new key, chords and hook. "Same parts, a different song."
- **3 Sticker**: 16 quick picks, or MORE STICKERS for all 250 by category. Tap one and it slaps onto the label, between the reels, as big as fits at a whole-number scale (96 px on a computer, 64 on a phone).
- **Cassette**: a row of fourteen 80s shells under the tape (70s triple stripe, Miami, clear blue, mint diagonal, sunset, lavender, smoked, tropic, swoosh, rainbow, teal split, sound, pink band, hot pink). Tap one, or tap the cassette itself (anywhere but the name) for the next. Their order is part of every tape link, so restyle them but never reorder.
- **4 Name it**: you write straight on the label (tap it). ↻ ANOTHER NAME rolls a random one. "from (optional)" is small on purpose; it shows as "Mixed by …" when someone opens the tape.
- **5 Save it. Share it.** SAVE TAPE puts it on your shelf (this browser only, up to 60). Then the button turns into **COPY LINK** (and **SHARE TAPE**, the phone's share sheet, where the browser has one) plus "save a picture of it", a 1200 × 630 card of the cassette. Change anything and it goes back to SAVE TAPE.
- **Your tapes** appears (with a TAPES link in the header) once you've saved one: PLAY/PAUSE, REMIX, COPY LINK, ✕ (tap twice).
- **A tape in the mail** (`?tape=…`): the cassette, PLAY, REMIX THIS TAPE, and "keep it on my shelf". Touching any control while someone else's tape (or one from your shelf) is in the deck turns it into a remix: same recipe, credited "remixed from" its maker. Lineage is one generation deep.
- The display shows SIDE A, the start sound, a tape counter and the tape name. The little level meter only lights while music is playing.

A first visit opens on **GROCERY RUN**: HOUSE with house drums, synth bass and pad at the easy speed, the Rainbow cassette and the unicorn sticker (`FIRST_TAPE` in `app.js`). After that, the page reopens on whatever you were last working on.

## First visit

The shelf starts with three tapes: GROCERY RUN (house, Rainbow, unicorn), SADURDAY BEATS (lo-fi, Sunset, crying face) and SIDE QUEST (8-bit, Lavender, wizard), as `STARTERS` in `app.js`. They're added once; throw one out and it stays gone. The deck opens on GROCERY RUN.

## Names

A new tape gets a random name, and the name rolls again whenever you pick another sound or hit NEW TUNE, with a quick yellow flash on the name field so you notice. Once you type your own name it stays put. ↻ hands naming back to the machine. Remixes keep the original's name until you change it. After you save, the next tape starts rolling names again.

## Layout

- **Computers:** the machine on the left (1 PICK A SOUND, 2 MIX IT, NEW TUNE), the tape bench on the right (3 MAKE IT YOURS): the cassette, then the name with ↻ and "mixed by (optional)" on one line, then SAVE TAPE, then stickers (15 quick picks and a MORE tile) and the cassette shells. SAVE TAPE sits above the fold on a 1366 × 768 laptop.
- **Phones:** the tape comes first so people see what they're making: the cassette, a swipeable row of stickers, then the machine, then name, save and shells.

## Stickers

The pack is CC0, licensed for commercial use with no attribution required. A sticker's ID is its cell on the sheet, `row × 25 + column` (0–249), and tapes store only that number. **If the sheet is ever replaced, every sticker must stay in the same cell.** Stickers are always drawn at whole-number scales (32, 64, 96 px…) with `image-rendering: pixelated`. On the cassette the sticker sits in the window, as big as the window allows at a whole-number scale. Animated stickers are not in yet (phase 2).

## Tape links

`?tape=` + base64url of a JSON array: `[8, name, shell, drums, bass, keys, outside, speed, start, seed, sticker, by?, from?]`.

- start: 0 lo-fi, 1 house, 2 ambient, 3 8-bit, 4 dub
- drums: 0 off, 1 soft, 2 lo-fi, 3 house, 4 dub
- bass: 0 off, 1 warm, 2 deep, 3 synth
- keys: 0 off, 1 Rhodes, 2 guitar, 3 pad, 4 8-bit
- outside: 0 off, 1 rain, 2 ocean, 3 fire, 4 purr (not offered any more, still plays)
- speed: 0–2

Version 9 is the same array for old-sound tapes. Catnip FM links (versions 6 and 7) still open and play the same music; they're given a sticker from their name. A link is about 100 characters.

Per-tape link previews would need a server. Every link shows `og.png` for now; SEND's SAVE PICTURE covers sharing the actual cassette.

## Broadcast mode (YouTube recordings)

`/?broadcast=video&tape=…` shows only the cassette, very large, playing, with SMALLBEATS.COM underneath. `&session=nine` plays the Nine Lives recipe with its late-night sheen instead. `&vol=0.8` sets the volume. Add it to OBS as a Browser source at 1920 × 1080 with "Control audio via OBS" ticked. Nothing is counted in analytics in broadcast mode.

## Rules this site follows

- Nothing interrupts the music: no dialogs, no navigation away from the tape, and the sticker tray slides up over the page.
- No keyboard shortcuts.
- Always dark.
- Square pixels are the illustration (stickers, cassette, keys); round dots are the machine (the display).

## Easter eggs

- Name a tape NINE LIVES.
- The browser console has a note.

## Before launch

- Point smallbeats.com at the host (the `CNAME` file is for GitHub Pages).
- Set up `hello@smallbeats.com`; it's in the about section, the footer and the legal pages.
- In Google Analytics, add a web data stream for smallbeats.com (or a new property, and change the ID in `analytics.js`).
- YouTube: `https://www.youtube.com/@smallbeatsfm`, linked in the header, the about section and every footer (new tab, so the music keeps playing), and as `sameAs` in the home page's structured data. Channel art is in the `youtube/` folder of the brand pack.

## Credits

Fonts: Silkscreen, Doto and IBM Plex Sans (SIL Open Font License). Licenses are in `fonts/`.
