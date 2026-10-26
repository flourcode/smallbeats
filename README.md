# Small Beats

**Make your own mixtape.** A tiny music machine at [smallbeats.com](https://smallbeats.com): pick a sound, mix a few parts, try another tune, put a sticker on the tape, name it, save it and share it. Whoever opens the link hears the same tape and can remix it.

No accounts, no server, no build step. YouTube: [@smallbeatsfm](https://www.youtube.com/@smallbeatsfm).

## Run it locally

Any static file server works:

```
cd smallbeats
python3 -m http.server 8000
```

Then open http://localhost:8000. Analytics stays off on localhost. The service worker only registers over https.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: header, the mixer, the tape bench, your shelf, about |
| `app.js` | Mixer, tape, stickers, shelf, sharing, share picture, broadcast mode |
| `engine.js` | The music engine (`window.SBE.band`) |
| `stickers.js`, `stickers.png` | Sticker metadata and the sticker sheet |
| `qr.js` | QR code generator (Kazuhiko Arase, MIT), loaded only when the shelf link is opened |
| `app.css` | All styles |
| `analytics.js` | Google Analytics 4 (`G-SBX0G743FR`); empty the ID to switch it off |
| `privacy.html`, `terms.html`, `404.html` | The other pages |
| `studio.html` | The Studio: builds broadcast addresses for OBS (unlisted, noindex) |
| `sw.js`, `manifest.webmanifest` | Offline copy and home-screen install |
| `og.png` | Link preview image, 1200 × 630 |
| `favicon.ico`, `icons/` | Tab and app icons, and `mark-2/3/4/6.png`: the Small Beats cat at 2, 3, 4 and 6 px per pixel for the header |
| `fonts/` | Silkscreen (labels and keys), Doto (the display and tape labels), IBM Plex Sans (body), with licenses |
| `CNAME`, `robots.txt`, `sitemap.xml` | Hosting and search |

## How it works

**The loop.** 1 START HERE (pick a sound) → 2 MIX IT → NEW TUNE → 3 MAKE IT YOURS (sticker, shell, name) → SAVE TAPE → COPY LINK / SHARE TAPE → they PLAY → REMIX → share again.

**State.** One draft (the tape you're making), the shelf (saved tapes), and what's in the player: the draft, a shelf tape, or a shared tape opened from a link. Touching any control while a shelf or shared tape is playing turns it into a new draft, a remix, credited "remixed from" its maker (one generation deep). Everything is kept in `localStorage` under `smallBeats`.

**Names.** A new tape gets a random name, and it rolls again when you change the sound or hit NEW TUNE (the field flashes). Typing your own name stops that; ↻ hands it back. After a save, the next tape rolls again.

**First visit.** The shelf starts with three tapes, `STARTERS` in `app.js`: GROCERY RUN (house, Smoked, happy calico), SIDE QUEST (8-bit, Lavender, wizard), SADURDAY BEATS (lo-fi, Sunset, crying face). They're added on a first visit, and again whenever the shelf is empty. `STARTER_V` in `app.js` goes up when the starters change: returning visitors then get the new versions in place of the old copies (and an old starter left as the draft becomes the new one). Throwing out one starter keeps it gone. The player opens on GROCERY RUN.

**Web Audio.** `band(ctx, destination, recipe)` builds one tape's sound and returns `{src, tick(until), bpm}`. The app calls `tick()` every 400 ms to schedule bars about two seconds ahead. Drums are synthesized noise and oscillators, the bass and keys are FM, subtractive and plucked-string (Karplus-Strong) voices, and 8-bit uses pulse waves. The seed picks a key, a mood, chord changes and a hook, and every part follows the same chords, so any combination fits. A lo-fi tape runs through a soft cassette chain (saturation, wow and flutter, a little hiss). Hiss (tape noise, a faint hum and the odd tick of dust), rain and fire are generated too, with random timing so they never loop. TIGHT drums play dead straight; SWING leans on the offbeats. Changing a part rebuilds the band with a short crossfade. Pause suspends the audio context, so the tune picks up where it stopped. On iPhone the audio session is set to playback, so it plays with the ring switch on silent.

## The shelf

- **Up front:** your three newest tapes as full cassettes, starred ones first. Each has PLAY, REMIX, COPY LINK, ✕ and a star on its corner.
- **The rack:** the rest of your tapes as spines (the cassette seen from the side: shell colour, the name, the sticker on the end). Tap a spine to play it; it slides out and shows REMIX, COPY LINK and ✕.
- **From friends:** a tape somebody else made goes onto your shelf as soon as you open its link (`gift`), with "from NAME" on its spine. Opening a link to one of your own tapes (same "mixed by") just offers KEEP.
- **Stars:** `fav` on the tape. Starred tapes move to the front of their section.
- **Throwing out:** one tap, then UNDO for seven seconds. No confirm dialogs.
- **PLAY THE SHELF:** plays yours (starred first), then your friends', three minutes each with a slow crossfade, round and round. The display shows SHELF 2/7. Touching anything else stops it.
- Up to 300 tapes in all. The first visit starts with three (GROCERY RUN starred), so the shelf explains itself. When you save a tape the site asks the browser, quietly, to keep its storage (not in Firefox, which would show a prompt).

**The shelf link** is the backup, with no accounts. SHELF LINK shows one link (and a QR code) holding every tape; opening it in any browser shows the tapes and a PUT THEM ON MY SHELF button, which adds the ones that aren't there yet and carries stars over. Format: `?shelf=z` + base64url of the raw-deflated JSON `[1, [[name, shell, drums, bass, keys, texture, speed, sound, seed, sticker, by, from, flags], ...]]`, flags 1 starred and 2 from a friend. Browsers without `CompressionStream` write `j` + the plain JSON instead. Ten tapes make a link of about 400 characters; past a few dozen tapes the QR code gets too dense and the panel says to use the link.

## Tape format

A tape link is `https://smallbeats.com/?tape=` + base64url of a JSON array:

```
[1, name, shell, drums, bass, keys, texture, speed, sound, seed, sticker, by?, from?]
```

| Field | Values |
|---|---|
| `1` | format version |
| name | up to 24 characters |
| shell | 0–13, the cassette look (`SHELLS` in `app.js`; never reorder) |
| drums | 0 off, 1 tight (straight), 2 swing. The kit comes with the sound: soft for ambient, lo-fi for lo-fi and 8-bit, house, dub |
| bass | 0 off, 1 warm, 2 deep, 3 synth |
| keys | 0 off, 1 Rhodes, 2 guitar, 3 pad, 4 8-bit |
| texture | 0 off, 1 rain, 2 hiss, 3 fire (shown as HISS, RAIN, FIRE) |
| speed | 0 slow, 1 steady, 2 fast |
| sound | 0 lo-fi, 1 house, 2 ambient, 3 8-bit, 4 dub (sets groove, tempo and drum kit; drums come in SWING for lo-fi, ambient and dub, TIGHT for house and 8-bit) |
| seed | 1–2147483647, the tune |
| sticker | 0–249, a sticker id |
| by, from | optional "mixed by" and "remixed from" names, 24 characters |

Anything that doesn't decode to this is ignored and the page opens normally. A link is about 100 characters.

## Stickers

`stickers.png` is an 800 × 352 sheet, 25 columns × 11 rows of 32 × 32. Rows 0–9 are the sticker pack (CC0, commercial use, no attribution needed). The CATS tab is ours, drawn for this site: five coats (warm tabby, orange, black, calico, siamese) in four faces (normal, happy, sleepy, headphones). They sit in the pack's old cat cells (200–208, redrawn) and in row 10 (250–260); the category's `ids` list sets their order in the tray. Each entry in `stickers.js` is `{id, slug, name, category, row, col}`, where `id = row × 25 + col`. That id is what a tape stores, so a sticker must never move to another cell. Each row is a category: smileys, love, sad, angry, shocked, silly, sleepy, characters, animals, symbols, plus CATS. `quick` lists the 15 shown under the tape; the last tile opens the rest in a tray. When the sheet changes, bump `stickers.png?v=` everywhere it's referenced. Stickers are drawn at whole-number scales only, with `image-rendering: pixelated` and a white die-cut edge. On the cassette the sticker sits between the hubs: 96 px on a computer, 64 px on a phone.

## Motion

- **The hop:** while a tape plays, its sticker hops up by one of its own pixels on beats 1 and 3, in time with the music.
- **Cats blink:** an open-eyed cat on a cassette closes its eyes for a moment every 5 to 8 seconds (`blink` in `stickers.js` pairs each with its closed-eye frame; 261-265 are blink frames for the headphone cats and never appear in the tray).
- **The squash:** a sticker squashes when you pick it.
All three are off for anyone whose device asks for reduced motion.

## Cassettes

Pixel art on a 56 × 33 grid (`cassPix` in `app.js`): a shell with stepped corners, a label with the name strip, the shell's print (stripes, swoosh, rainbow…), a window with two hubs whose teeth step round while it plays, and the bottom trapezoid. Drawn as SVG on the page and on a canvas for the share picture and `og.png`.

## Layout

- **Computers:** the mixer on the left, the tape bench on the right: tape, name with "mixed by (optional)", SAVE TAPE, then stickers and shells. SAVE TAPE is above the fold on a 1366 × 768 laptop.
- **Phones:** tape first, a swipeable row of stickers, then the mixer, then name, save and shells.

No keyboard shortcuts, no dialogs, and nothing that stops the music: the sticker tray slides over the page, and YouTube links open in a new tab. Always dark: a deep brown (`--bg:#2a1915`) so the tapes pop, with the display kept near-black.

**The stripe.** Five pixel stripes (cream, gold, orange, red, brown; `STRIPE` in `app.js`) drawn in 4 px cells on a canvas by `drawStripe()`. On computers it runs under the name, behind the cat's chin, and bends up before the links; on phones it's one straight band under the header. It redraws on resize and is hidden in broadcast mode.

## Broadcast mode and the Studio (YouTube recordings)

**The Studio** is `/studio.html`: not linked from the site and not indexed. It builds the broadcast address for you. Pick tapes from your shelf (it reads this browser's shelf) and/or paste tape links people sent you, choose 16:9 or 9:16 (Shorts), set the minutes per tape and the volume, and watch a preview. Then COPY ADDRESS into OBS, or OPEN IN A NEW WINDOW to record the screen.

**What's on screen** (one tape, one equalizer, one cat; made to be left on for hours and glanced at):
- the cassette, big and just above the middle, its reels turning and the tape winding from the left reel to the right over each turn; at the turn the next tape crossfades in, and each time a tape comes round again it plays its other side;
- under it, as wide as the tape, a dot-matrix equalizer in the stripe's colours (brown at the bottom, up through red, orange and gold to a cream tip), lows on the left, with peaks that hang and drift down;
- bottom-left, the Small Beats cat with SMALL BEATS and smallbeats.com: it nods on beats 1 and 3, blinks, and every minute or so closes its eyes for a bar;
- top-left, now playing (name, sound, MIXED BY, REMIXED FROM); top-right, NEXT · NAME 30 seconds before a turn; under now playing, every third turn (every other one with a single tape), DROP YOUR TAPE LINK IN THE COMMENTS (`&ask=0` turns that off). In 9:16 the corner lines stack top-left and the cat sits above where Shorts and Reels put their captions;
- behind it all: the warm brown with a soft vignette and faint grain, and the tape's texture in big pixels (rain falling, the glow and embers of a fire just out of shot, or a little hiss of grain);
- over two hours the background warms and dims a little and comes back, and every four minutes everything shifts a few pixels so nothing burns into a screen.
The engine reports every bar it schedules (`onHit` on the recipe), which is what the nods and the sticker hop follow.

**The Studio also writes the YouTube chapters:** give it the video's length and it lists each turn with its time, tape and maker, then each tape's link, ready for the description (not with shuffle, since the order isn't known).

**The address:** `/?broadcast=video&tape=…[&tape=…][&each=10][&shuffle=1][&vol=0.8][&ask=0]` shows only the cassette, very large, playing. Several tapes take turns, `each` minutes apiece (1 to 240, default 10), with a slow crossfade, round and round. Under the cassette: MIXED BY whoever made the tape (and REMIXED FROM, if any), then MAKE YOURS AT SMALLBEATS.COM. A tape without a maker just shows SMALLBEATS.COM. Without a tape it plays the visitor's current draft. The layout works in any shape; in portrait the credits sit higher, clear of the captions Shorts and Reels put at the bottom. In OBS: a Browser source at 1920 × 1080 (or 1080 × 1920) with "Control audio via OBS". Nothing is counted in analytics in broadcast mode.

## Analytics

GA4 with Consent Mode (ads storage always denied; analytics storage denied in the EEA, UK and Switzerland), not loaded with Do Not Track or Global Privacy Control. Events: `play`, `pause`, `genre_select`, `part_toggle`, `new_tune`, `sticker_select`, `tape_name`, `tape_save`, `tape_share`, `tape_open`, `tape_remix`, `tape_fav`, `play_all`, `shelf_link`, `shelf_restore`, `product_hunt` (the footer badge).

## Deploy

Upload the folder to any static host. `CNAME` is for GitHub Pages. The service worker is network-first, so a deploy shows up on the next visit; change `CACHE` in `sw.js` only if its caching logic changes. When `og.png` changes, bump its `?v=` in `index.html` so social sites refetch it.

Contact: hello@smallbeats.com

## Brand

- **Logo:** the Small Beats cat (a grey tabby in headphones, sticker 250) next to the SMALL BEATS wordmark in Silkscreen. Site header. The cat alone is the favicon, app icon and YouTube avatar.
- **Brand tape:** the Smoked cassette labelled SMALL BEATS with the cat on it and no "90" (`brand:1` on the tape object hides it). Link preview and YouTube banner.
- **Colours:** deep brown `#2a1915` and the five-colour stripe. The cat is a warm grey (`#b0a79e`, light `#ded7ce`, shadow `#867c74`) with dark stripes (`#342c2c`).
- Users' tapes can wear any sticker; the cat is just one of them.
