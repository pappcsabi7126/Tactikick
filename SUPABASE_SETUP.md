# TactiKick – Supabase setup

1. Create/open your Supabase project.
2. Open SQL Editor and run `supabase-schema.sql` once.
3. In the project root create `.env` from `.env.example`.
4. Put the Supabase Project URL and the **publishable/anon client key** in `.env`.
5. In Supabase Auth -> URL Configuration, add your local Vite URL (usually `http://localhost:5173`) to Site URL / Redirect URLs.
6. If Discord login is desired, enable Discord under Auth -> Providers and add the Discord OAuth credentials there.
7. Run `npm install` and then `npm run dev`.

The app keeps the localStorage demo mode when Supabase is not configured. Once the Supabase publishable key is present, login is required and teams, players, trainings and profile data are loaded from Supabase.
