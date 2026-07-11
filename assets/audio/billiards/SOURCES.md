# Heartbeat Billiards audio sources

All files in this directory are edited from real-world recordings. No oscillator,
procedural synthesis, text-to-audio generation, or synthesized substitute was
used. The downloaded inputs were Freesound's public HQ MP3 previews of the
recordings named below.

All seven source recordings are released under
[Creative Commons Zero 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
(CC0). CC0 permits copying, modification, and redistribution, including
commercial use, without required attribution. Credits are retained here for
provenance; no front-end credit is required.

Source and file mapping (accessed 2026-07-11):

| Local file | Original recording and author | License | Edit from source |
| --- | --- | --- | --- |
| `cue-strike.ogg` | [Pool_Table_Ball_Hit_Sink.WAV](https://freesound.org/people/AmberdeMeillon/sounds/443066/) by AmberdeMeillon; a wooden cue striking a pool ball, followed later by a ball collision | CC0 1.0 | 3.735-4.035 s, isolating the cue-to-cue-ball contact; mono; peak target -3 dBFS |
| `ball-contact-soft.ogg` | [billiard ball clack](https://freesound.org/people/Za-Games/sounds/539854/) by Za-Games; solid billiard balls struck together | CC0 1.0 | 0.000-0.155 s; mono; peak target -7 dBFS |
| `ball-contact-hard.ogg` | [Pool balls.wav](https://freesound.org/people/bsumusictech/sounds/62331/) by bsumusictech; pool balls hitting other pool balls | CC0 1.0 | 7.235-7.565 s, an isolated stronger collision; mono; peak target -3 dBFS |
| `rail-contact.ogg` | [pool-ball-bounce-off-rail.wav](https://freesound.org/people/mccarthy@bedmas.com/sounds/42364/) by mccarthy@bedmas.com; a number 9 pool ball bouncing off a real table rail, recorded on a Nokia 6125i | CC0 1.0 | 0.350-0.731 s; mono; peak target -5 dBFS |
| `pocket-drop.ogg` | [Inside_Pool_Table.WAV](https://freesound.org/people/AmberdeMeillon/sounds/443057/) by AmberdeMeillon; a pocketed ball recorded from inside a pool table | CC0 1.0 | 4.680-5.930 s, retaining the pocket impact and short internal-table rumble; mono; peak target -4 dBFS |
| `event-soft.ogg` | [Small Bell](https://freesound.org/people/steffcaffrey/sounds/452371/) by steffcaffrey; a recorded small Christmas bell (Audient preamp and Rode NTK microphone) | CC0 1.0 | 0.000-0.950 s; stereo; peak target -9 dBFS |
| `stage-rise.ogg` | [SMALL BELL - 1](https://freesound.org/people/SamuelGremaud/sounds/517611/) by SamuelGremaud; a small bell recorded with a Zoom H4N Pro | CC0 1.0 | 0.270-1.820 s; stereo; peak target -6 dBFS |

## Processing

- Decoded and cut with FFmpeg 8.1.2; encoded with oggenc 1.4.3.
- Kept only the useful recorded transient and a short natural decay.
- Applied peak gain adjustment and a short tail fade to prevent clicks.
- Encoded as browser-playable Ogg Vorbis at 48 kHz: quality 4 mono for
  billiards impacts and quality 5 stereo for the two restrained notification
  sounds.
- Removed inherited metadata; audio provenance is documented in this file.

## Delivered file properties

| File | Duration | Channels | Bit rate | Decoded peak |
| --- | ---: | ---: | ---: | ---: |
| `cue-strike.ogg` | 0.300 s | 1 | 86 kb/s nominal | -3.3 dBFS |
| `ball-contact-soft.ogg` | 0.155 s | 1 | 86 kb/s nominal | -7.3 dBFS |
| `ball-contact-hard.ogg` | 0.330 s | 1 | 86 kb/s nominal | -2.9 dBFS |
| `rail-contact.ogg` | 0.381 s | 1 | 86 kb/s nominal | -5.2 dBFS |
| `pocket-drop.ogg` | 1.250 s | 1 | 86 kb/s nominal | -3.9 dBFS |
| `event-soft.ogg` | 0.950 s | 2 | 160 kb/s nominal | -8.9 dBFS |
| `stage-rise.ogg` | 1.550 s | 2 | 160 kb/s nominal | -6.1 dBFS |
