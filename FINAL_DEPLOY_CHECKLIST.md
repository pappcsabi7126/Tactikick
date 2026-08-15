# TactiKick – Final Netlify deploy

This package is the clean source project. It does not include `.env`, `node_modules`, `dist`, or `.git`.

## 1. Keep your existing `.env`

Do not replace your working `.env`. It must contain:

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

## 2. Install and verify locally

```cmd
npm install
npm run build
npm run dev
```

## 3. Git deploy

```cmd
git add .
git commit -m "Finalize TactiKick club calendar"
git push origin main
```

## 4. Netlify

Build command: `npm run build`
Publish directory: `dist`
Node: 20

Add the same two `VITE_` environment variables in Netlify → Site configuration → Environment variables.

## Important

The app loads teams/players/trainings from Supabase using the authenticated user's ID. Do not switch accounts when testing the data. The account containing the existing data is the one whose profile currently has 2 teams, 29 players and 10 trainings.
