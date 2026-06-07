# 13—0

A minimalist **Champions League XI builder**. Draw an edition (2010-11 → 2024-25)
and one of the era's great clubs, place eleven players on an interactive pitch,
then simulate whether your side can win Europe.

> *"Every draw is a new chance to write the history of Europe."*

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** (navy `#0a1628` · gold `#c9a84c` · cream `#f4f1e8`)
- **Playfair Display** + **Cormorant Garamond** (Google Fonts)
- Zero backend — pure local state, deployable to **Vercel** as a static SPA.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Deploy on Vercel

A `vercel.json` is included (framework **Vite**, build `npm run build`, output
`dist`, SPA fallback). To get a live URL:

1. On [vercel.com](https://vercel.com) → **Add New… → Project**.
2. Import the GitHub repo `AngelNueveDos/13-0`.
3. Vercel auto-detects the config — just click **Deploy**. No env vars.

After the first import, **every push redeploys automatically**: pushes to a
branch create a Preview URL, pushes to the default branch update Production.

## How it works

1. **Draw** — a random edition + club is revealed.
2. **Select** — pick a formation (4-3-3, 4-4-2, 4-2-3-1, 3-5-2) and tap each
   position to choose a compatible player. Tokens show the player's monogram,
   FIFA rating and role.
3. **Simulate** — the campaign is weighted by your XI's average rating
   (avg > 88 ≈ favourites). You get a verdict, scoreline and goal tally.

## Data model

Players carry **only** `name`, `rating` (the club's FIFA-season rating) and
`positions[]`. Squads live in [`src/data/teams.js`](src/data/teams.js) and the
schema is built so additional editions/clubs drop in with **zero code changes**.

```js
{
  club: 'Real Madrid',
  edition: '2013-14',
  crown: 'Winners · La Décima',
  players: [
    { name: 'Cristiano Ronaldo', rating: 99, positions: ['LW', 'ST', 'RW'] },
    // …
  ],
}
```

### Data coverage

The two marquee squads (Real Madrid 2013-14, Barça 2014-15) are filled exactly
per the brief; several more iconic winning squads are included so the draw feels
alive. The complete database — every player of the 16 best clubs of **every**
edition from 2010-11 onward — is a large, accuracy-sensitive dataset; see the
chat note on how to supply it (CSV/Excel/JSON) to fill `src/data/teams.js`.
