# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
## Data storage

Existing browser data remains under the legacy `coachapp-*` localStorage keys. After Supabase is configured, the signed-in account syncs teams first, then players, then trainings so foreign-key relationships remain valid.
## New account behavior

A new Supabase account starts with empty teams, players, trainings, and training templates. Legacy browser data is migrated only when the stored account owner or profile email matches the signed-in account; it is never claimed by a different account.

## Fontos: Supabase adatok megőrzése

A TactiKick üzleti adatai (csapatok, játékosok, edzések) Supabase-ból töltődnek be. A kliens nem törli a régi `localStorage` kulcsokat, és nem indít szinkronizálást addig, amíg az aktuális felhasználó adatai sikeresen be nem töltődtek.

Ha a Supabase kapcsolat hiányzik, az alkalmazás ezt külön jelzi, és nem jelenít meg megtévesztő üres állapotot.

### Local futtatás

A projekt mellett legyen egy `.env` fájl a következőkkel:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

A `.env` fájlt ne commitold GitHubra. A repositoryhoz a `.env.example` tartozik.
