# Small Beats

**Make your own mixtape.** A tiny music machine at [smallbeats.com](https://smallbeats.com). Pick a style, tap the parts, play along on the keys, SAVE TAPE, then EJECT to name it, pick a buddy for the label and send the link. Whoever opens it hears the same tape and can remix it.

No accounts, no server, no build step, nothing loaded from other websites except Google Analytics. YouTube: [@smallbeatsfm](https://www.youtube.com/@smallbeatsfm).

## Run it locally

```
cd smallbeats
python3 -m http.server 8000
```

Open http://localhost:8000. Analytics stays off on localhost; the service worker only registers over https.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: header, the SB-1 machine, the EJECT sheet, your shelf, Buddies Met, about (including Small Beats FM, the YouTube channel, and who made it) |
| `app.js` | The machine, the screen (scenes, sky, weather, the band), the keyboard and PLAY ALONG, tapes, shelf, sharing, the share picture, broadcast mode |
| `engine.js` | The music engine (`window.SBE.band`) |
| `composer.js` | The newer composer, used for Trance (`window.SBC`) |
| `buddies.js` | The 50 buddies, one-colour pixel sprites as hex bitmasks, with draw helpers |
| `qr.js` | QR code generator (Kazuhiko Arase, MIT), used for the shelf link and a tape's QR |
| `app.css` | All styles |
| `analytics.js` | Google Analytics 4 (`G-SBX0G743FR`); empty the ID to switch it off |
| `privacy.html`, `terms.html`, `404.html` | The other pages |
| `how-it-works/index.html` | The write-up: how every note is made |
| `studio.html` | The Studio: builds broadcast addresses for OBS (unlisted, noindex) |
| `sw.js`, `manifest.webmanifest` | Offline copy and home-screen install |
| `og.png` | Link preview, 1200 × 630 |
| `favicon.ico`, `icons/` | Tab and app icons; `logo-2/3/4/6.png` are the header logo (Dino plus the stacked wordmark) at 2, 3, 4 and 6 px per pixel; `mark-3.png` and `mark-6.png` are Dino alone (the 404 page) |
| `fonts/` | Silkscreen (the LCD, labels), Barlow Condensed (case labels), IBM Plex Sans (body), Doto, with licenses |
| `CNAME`, `robots.txt`, `sitemap.xml` | Hosting and search |
| `../smallbeats-youtube/` | YouTube profile picture (800 × 800), banner (2560 × 1440), a safe-area guide, and `brand/` (the logo large, on transparent and on brown, plus the alternate) |

## The machine

- **The screen:** a fixed amber LCD. Top line: the tape number, style and tempo; the tape's name; the band standing on a dot equalizer; a status strip (time, and what Dino is doing).
- **The tape door:** the Mini Tape (a pixel microcassette) behind an aged plastic cover, between speaker grilles. Tapping it opens EJECT.
- **SAVE TAPE** puts the tape on your shelf (RECORDING… / PRINTING LABEL… / SAVED on the screen). **EJECT** pops the tape and opens the sheet: SEND TAPE (the share menu, or copies the link), COPY LINK, QR, SAVE CARD; then the label (NAME, MIXED BY) and the look (buddy, shell).
- **PLAY** (the one orange key). The first PLAY of a visit powers on: SMALL BEATS drops down the screen with a ding.
- **Six styles:** Lo-fi, House, Ambient, 8-Bit, Dub, Trance. Choosing one sets the drums, bass and keys for that style and keeps your TEXTURE. Each has one colour (blue, yellow, sky, Game Boy green, red, purple, all the same lightness), shown only on its own key, the keys as they light, the PLAY ALONG light.
- **NEW** is a "?" block: the step lights race, the reels spin, the band freezes, and the new tune lands on beat 1. Hold it and the names spin like a slot machine. **UNDO** takes back any change.
- **Six parts:** DRUMS, BASS, KEYS, TEXTURE, SPEED, VOLUME. Tap to change; the music changes on the next beat. Cream readings, amber lights.
- **The keyboard:** every key is a note of the song's pentatonic scale, so nothing clashes. It's a little synth voiced per style, played through the song's own echo; hold a key to hold the note. The keyboard has its own channel, a little louder than the band, and the band dips gently while you play and comes back when you stop, so your notes always sit on top. The keys light up as the tune plays (a player piano); the keys you press light brighter. **PLAY ALONG:** while the music plays, whatever you play joins the song: play, stop for a moment, and your last two bars become part of the tape (they repeat, and travel with the link). The button's light blinks red while you're playing; your notes hush while you play over them; a new phrase replaces the old one, and one stray tap doesn't count. CLEAR MY NOTES takes them out; UNDO brings them back.
- **Every press** makes a tiny sound and, on Android, a tiny buzz.
- **The stamp:** the logo is stamped on the case, lower right in the bezel under the keyboard (`icons/stamp-1/2/4.png`, the same lockup at 1, 2 and 4 px per pixel). In the videos it sits in the credits, with the QR code to its left.
- **On phones** the whole machine fits the screen: the keyboard and the six part keys share the bottom of the machine, swapped with KEYBOARD / PARTS on the keyboard's rail (PLAY ALONG brings the keyboard back). On very short phones, the first PLAY scrolls the machine fully into view.
- **Fits a laptop:** on computers the header tightens and, on shorter screens, the tape (and the screen beside it) gets a little smaller, so the keys are always on screen; the keys never shrink.

## The screen

- **The band:** the tape's buddy hosts, and each part that's on (drums, bass, keys) brings a buddy of its own. They wander like virtual pets, a step per beat (SPEED sets the pace), leap over each other, never overlap, and stand on the equalizer bars. VOLUME sets how high they jump.
- **They react:** a style change makes them jump, a new part's buddy bounces in, saving makes them cheer. Dino headbangs to more bass, chills on Ambient, glitches on 8-Bit, looks around confused when the drums stop, and gets up to nonsense when left alone. After a while with nobody touching anything he settles into reading, fishing (at the sea), a campfire (at night) or stargazing. Dino always looks the same: sunglasses and headphones, and nothing floats over his head.
- **Poke them:** each buddy sings its own note. Poke Dino five times quickly for a surprise.
- **The city at night,** in faint "ghost ink", scrolling with the tempo. Dino and the crew are always walking through it; each style is a district with its own buildings: lo-fi OLD TOWN (low rows, warm windows, street lamps), house MIDTOWN (tall towers blinking on the beat), ambient CENTRAL PARK (treetops under a wall of towers, park lamps, a stone bridge), 8-bit ARCADE ROW (signs flickering on the beat), dub THE HARBOR (warehouses and cranes; Dino fishes here), trance THE BRIDGE (an elevated road with headlights streaming past). A faint skyline behind and stars above, always. The bass makes the ground thump. Walking into a new district shows its name.
- **The sky:** it's always night. The moon crosses over the hours of your own day (over forty minutes on a broadcast).
- **The opening:** the first PLAY of a visit drops SMALL BEATS and DINO & THE CREW down the screen, then NIGHT n (one more for every day you come back) and the district they're in.
- **Weather** from TEXTURE: rain (falling at the tape's SPEED), hiss (static), fire (embers).
- **Visitors:** shooting stars and bats crossing the moon, a rare UFO on Trance, and after ten minutes a buddy passing through. Each first sighting is recorded in Buddies Met.
- **Attract mode:** before the first PLAY, PRESS ▶ PLAY blinks and Dino walks over towards it. A tape someone sent you shows A TAPE FROM …

## Your shelf

- Your newest tapes up front (starred first), with PLAY, REMIX, COPY LINK and ✕.
- **ALL YOUR TAPES ▾** opens the rack (the rest, as spines) and SMALL MAIL (tapes people sent you; opening a link puts it here).
- **Buddies Met:** all 50 buddies, lit once you've seen them, plus the sightings (bird, shooting star, UFO, a visitor, Dino says hi). Nothing is locked.
- **PLAY THE SHELF** plays them in turn. **SHELF LINK** (and QR) moves every tape (with any notes played along) to another browser: `?shelf=z` + base64url of raw-deflated JSON.
- Throwing a tape out has UNDO; no confirm dialogs. Up to 300 tapes. Everything is kept in `localStorage` under `smallBeats`.
- **First visit:** three starters, all Graphite: GROCERY RUN (house, Dino), SIDE QUEST (8-bit, Oink), SADURDAY BEATS (lo-fi, Shroom). `STARTER_V` goes up when they change.

## Tape format

`https://smallbeats.com/?tape=` + base64url of:

```
[1, name, shell, drums, bass, keys, texture, speed, sound, seed, buddy, by?, from?, notes?]
```

| Field | Values |
|---|---|
| `1` | format version |
| name | up to 24 characters |
| shell | 0 Graphite, 1 Tangerine, 2 Creme, 3 Bubblegum |
| drums | 0 off, 1 tight, 2 swing |
| bass | 0 off, 1 warm, 2 deep, 3 synth, 4 wave |
| keys | 0 off, 1 Rhodes, 2 guitar, 3 pad, 4 8-bit |
| texture | 0 off, 1 rain, 2 hiss, 3 fire |
| speed | 0 slow, 1 steady, 2 fast |
| sound | 0 lo-fi, 1 house, 2 ambient, 3 8-bit, 4 dub, 5 trance |
| seed | 1–2147483647, the tune (and the tape's number) |
| buddy | 0–49, a place in `buddies.js` (49 is Dino); never reorder |
| by, from | optional "mixed by" and "remixed from" names |
| notes | optional, the notes played along on the keyboard: 3 base-36 characters a note (sixteenth 0–31, scale step, length 1–16) |

Anything that doesn't decode is ignored and the page opens normally.

## Sound

`band(ctx, destination, recipe)` builds a tape's sound; the app schedules bars about two seconds ahead on the audio clock. Drums are synthesized noise and oscillators; bass and keys are FM, subtractive and plucked-string voices; 8-bit is pulse waves. The seed picks a key, a mood, chord changes and a hook, and every part follows the same chords. Lo-fi runs through a soft cassette chain. Rain, hiss and fire are generated with random timing so they never loop, and sit well under the music. Every style is trimmed to the same loudness (measured), with a gentle compressor on the way out. On iPhone the audio session is set to playback, so it plays with the ring switch on silent.

## Broadcast mode and the Studio (YouTube)

`/?broadcast=video&tape=…[&tape=…][&each=10][&shuffle=1][&vol=0.8][&ask=0]` shows the whole machine playing by itself, scaled to the frame: 16:9 for YouTube (laid out exactly as on a computer: screen, tape door, SAVE/EJECT, PLAY and the style keys, the parts, the keyboard, with the credits under it; nothing can be pressed), 9:16 for Shorts (the phone layout). Tapes take turns, `each` minutes apiece, with a slow crossfade; each comes back on its other side. A credits strip shows NOW PLAYING, MIXED BY, NEXT, and now and then DROP YOUR TAPE LINK IN THE COMMENTS. For the long videos the band travels to a new place every eight minutes (city, hills, sea, mountains, skyline, stars), the sky has a forty-minute day, and Dino settles into his activities. Now and then a little pixel hand plays the machine, so viewers see it's an instrument they can play (`&demo=0` turns it off): on long videos a riff on the keys or five pokes for Dino every few minutes, the tape itself never changing; on Shorts a quick tour every minute (a riff, the drums off so Dino looks around confused, the drums back so everyone jumps, rain, Dino spinning, a new bass). The LCD's status strip shows PLAY IT LIVE · SMALLBEATS.COM now and then, and on 16:9 a QR code in the credits opens the tape that's playing. As on the site, the bold diagonal stripe runs behind the machine, and the logo is stamped on the machine itself, lower right under the keys, with the QR code to its left. With `&mood=night` (the Studio's NIGHT CITY, the default) the band stays in one lonely city all video: always night, the moon crossing every forty minutes, rain drifting in and out every quarter hour (seen, not heard). A viewer's tape (any MIXED BY name but Small Beats) comes on with SMALL MAIL FROM (their name) on the screen. `/studio.html` builds these addresses and writes YouTube chapters; it has six late-night showcase tapes by Small Beats (OFF THE CLOCK, LATE SHIFT, PHONE CORD, ARCADE CARPET, NIGHT BUS, LAST TRAIN: minor keys, slow, rain and hiss), ticked to start, title ideas, and a ready description with chapters and the Small Mail call, plus your own shelf and any links you paste. In OBS: a Browser source at 1920 × 1080 (or 1080 × 1920) with "Control audio via OBS".

## Brand

- **Logo:** Dino in lines (a little T-rex in sunglasses, cream `#efe6d2` with orange headphones `#f0883a`) next to SMALL / BEATS stacked in chunky hand-drawn letters, two pixels thick, on the same pixel grid, with one hard dark shadow. That stacked chunky version is the logo; a thinner stacked version (`brand/small-beats-logo-alt.png`) is the quieter alternate. Dino alone is the favicon, app icon and YouTube profile picture. On the LCD and on tape labels Dino is the one-colour screen drawing.
- **Colours:** deep brown `#2a1915`, the five-colour stripe (cream, gold, orange, red, brown), the amber LCD `#f2d58e` with ink `#2d2414`, PLAY orange `#e8782e`, record red only for recording.
- **The stripe:** chunky 4 px pixel bands under the header that bend up before the links in a round, pixel-stepped corner, and a bold diagonal band behind the machine.
- **Link preview** (`og.png`, bump `?v=` when it changes) and the YouTube profile and banner use the same Dino and Mini Tapes.

## Analytics

GA4 with Consent Mode (ads storage always denied; analytics storage denied in the EEA, UK and Switzerland), not loaded with Do Not Track or Global Privacy Control, off in broadcast mode. Events: `play`, `pause`, `genre_select`, `part_toggle`, `new_tune`, `undo`, `buddy_select`, `loop_rec` (your notes joined a song), `sheet_open`, `tape_name`, `tape_save`, `tape_share`, `tape_open`, `tape_remix`, `tape_fav`, `play_all`, `shelf_link`, `shelf_restore`.

## Deploy

Upload the folder to any static host (`CNAME` is for GitHub Pages; the site runs on AWS Amplify). The service worker is network-first, so a deploy shows up on the next visit.

## Launch checklist (Oct 27, 2026)

- [x] Logo, favicon, app icons and link preview are the line Dino.
- [x] YouTube profile picture and banner remade (in `smallbeats-youtube/`), banner text inside the 1546 × 423 safe area.
- [x] About, features, Privacy, Terms and How it works match the current machine.
- [x] Service worker caches every file the page needs, so it works offline.
- [x] Every page loads with no errors and no broken links or images.
- [ ] A long listen of a YouTube video end to end, for loudness and anything jarring.
- [ ] A real-phone pass: sound, button sounds, Android buzz, the first ten seconds.

Contact: hello@smallbeats.com


## Releases

Every page loads its scripts and styles with `?v=<build>` (and `index.html` carries `<meta name="build">`), so browsers, OBS and the host never serve an old copy. Bump the number in every page, `sw.js` and the build tag on each release.
