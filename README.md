# SAME SEAT

One maquette. One pose. Fifteen rooms.

A seated figure never changes posture while the world is replaced about once a second: plaster studio, neon midnight, cut paper, kiln, ice, blueprint, dunes, ink weather, gilt, marble, biolume, newsprint, stained glass, pixel, then a lamp-lit room. In that last room the figure lifts the cup, takes a sip, and sets it back down. The loop is 16 seconds. No account and no API key.

This is an original study. It borrows the rhythm of a one-liner style reel — locked subject, hard style cuts, a drink at the end — and none of the characters, brands, or worlds from that clip.

## Live

Public production URL (no SSO, no password):

**https://style-morph-sip.vercel.app**

## Controls

| Action | Control |
| --- | --- |
| Pause / play | Space, or click the picture |
| Previous / next room | Left / Right arrows, or Prev / Next |
| Restart | R |
| Sound | M, or Sound off / Sound on |
| Full screen | F |
| Jump to a room | Number keys 1–9, or the ticks under the title |

Deep links:

- `?world=4` starts at Floe (rooms are 0–14)
- `?t=14.9&pause=1` holds the sip
- `?pause=1` starts paused

Sound is off until you turn it on. The bed is generated in the browser.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy

The live site is a production deployment of this branch, not of `main`. Pushing an empty `main` does not replace it.
