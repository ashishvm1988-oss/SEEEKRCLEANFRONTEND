# Seeekr — Web Frontend

The real web app, wired to the Seeekr API (the backend you already have). Built with React + Vite — no heavy frameworks, no state-management libraries, just fetch calls and React's built-in state. Production build is ~80KB gzipped.

## What's here

- Customer & provider login/signup (role chosen at signup)
- Home: location, search bar, category grid, nearby providers
- Category → subcategory drilldown, and full search (by service, name, or city)
- Provider profile: about, services, portfolio images, rating, message/call
- Messaging: conversation list + live-feeling thread (polls every 4s)
- Account: profile editing, and for providers, their subscription status (trial / active, next billing date)

Not included, on purpose, per the agreed MVP scope: the Explore/ads feed, reviews (writing them — the backend's review table needs a small fix first, see below), and switching roles after signup.

## Running it locally

1. Make sure the backend API is running (see its own README) — by default the frontend expects it at `http://localhost:8080`. To point elsewhere, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Install and run:
   ```
   npm install
   npm run dev
   ```
3. Open the URL Vite prints (usually `http://localhost:5173`). The backend's `ALLOWED_ORIGINS` needs to include this exact URL — it already defaults to it.

`npm run build` produces a static `dist/` folder you can deploy anywhere that serves static files (Netlify, Vercel, S3+CloudFront, or a folder on your existing AWS box).

## A few things worth knowing

- **Subscriptions endpoint added.** The backend didn't have a way to fetch "my own subscription status," so I added a small `GET /subscriptions/me` (read-only — no billing logic changes). It's a new handler + router, registered the same way as everything else in `app.js`.
- **Reviews are not wired up.** The `review` table's schema doesn't cleanly distinguish "who wrote the review" from "who it's about" — the existing `review.create` code would actually break the rating shown on search results if used as-is. I left this out of the MVP rather than ship something that quietly corrupts ratings; it's a clean, contained fix for a later pass.
- **Role is fixed at signup.** The update-profile endpoint intentionally blocks changing your own role (a customer can't silently become a provider through a form field), so there's no in-app "become a provider" flow yet — that would need a dedicated backend endpoint.
- Tested end-to-end against a live local copy of the backend (signup, login, search, messaging both directions, profile editing) using a small Playwright script (`e2e-test.mjs`) included here — feel free to delete it, or keep it as a smoke test before you deploy.
