# TactiKick

Edzői és klubmenedzsment alkalmazás csapatok, játékosok, edzések, jelenlét, klubnaptár és PDF-export kezeléséhez.

## Fejlesztés

Követelmény: Node.js 20 vagy újabb.

```bash
npm install
copy .env.example .env
npm run dev
```

Az `.env` fájlban egy Supabase projekt URL-je és publishable kulcsa szükséges:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Az `.env` nincs verziókezelés alatt. Privilegizált `service_role` kulcsot soha ne tegyél kliensoldali környezeti változóba.

## Ellenőrzések

```bash
npm run lint
npm run build
npm run check
```

## Adatok

- A profilok, csapatok, játékosok, edzések és edzéssablonok Supabase-ben tárolódnak.
- A böngésző helyi mentése biztonsági tartalék és korábbi CoachApp-adatok migrációjára szolgál.
- A klubnaptár, pályák és klubtag-beállítások jelenleg böngészőnként, `localStorage`-ban tárolódnak.
- A Supabase sémát a `supabase-schema.sql` fájl tartalmazza, RLS szabályokkal együtt.

## Telepítés

A repository Netlify-konfigurációt és SPA redirectet tartalmaz. Telepítéskor a két `VITE_SUPABASE_*` változót a szolgáltató környezeti beállításaiban is meg kell adni.

Build parancs: `npm run build`

Publikálandó könyvtár: `dist`
