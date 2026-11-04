# ADN

The ADN website: projects, a small timing game, community links, contact details and moderated reviews.

## Run it locally

```bash
npm install
cp .env.example .env   # then set ADMIN_PATH and ADMIN_TOKEN
npm run dev            # site on http://localhost:5173
```

Locally, reviews are saved in `server/data/reviews.json`.

```bash
npm test               # API tests, using a temp folder and a fake Redis
npm run build          # typecheck and production build
npm run server         # serve the build on http://localhost:3001
```

## Deploy on Vercel

Vercel's filesystem is read-only, so reviews need a database. Until one is connected, the site still works and the review form points visitors to Discord and email instead.

1. In the Vercel project, open **Storage** and add **Upstash Redis** (the free plan is enough). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. Under **Settings > Environment Variables**, add `ADMIN_PATH` (a long random path) and `ADMIN_TOKEN` (a long random password).
3. Redeploy. Environment changes only apply to new deployments.
4. Open `/api/health`. It should say `"storage":"redis"`.

## Moderating reviews

New reviews stay hidden until you approve them. Open `https://your-site/<ADMIN_PATH>/`, sign in with `ADMIN_TOKEN`, then approve, unpublish or delete.

## Editing content

- Projects, contacts and stats: `src/data/site.ts`
- Project screenshots: `public/projects/`
