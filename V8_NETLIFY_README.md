# TactiKick V8 – Netlify ready

## This version fixes
- Replaced the native `alert()` after copying a week with a non-blocking toast.
- Copying a week now preserves existing events instead of deleting the target week's events.
- Duplicate events are skipped during week copy.
- Pitch zones are grouped as:
  - 1 + 2 = 1st half
  - 3 + 4 = 2nd half
- Event details display `1. térfél`, `2. térfél`, or `Teljes pálya` when applicable.
- Event editor clearly separates the two halves.
- Multi-pitch and zone conflict checking remains enabled.
- Event detail remains view-first; editing is a separate action.

## Netlify
Build command:
`npm run build`

Publish directory:
`dist`

Before push:
`npm install`
`npm run build`


## V9 adatmegőrzési javítás
- Régi `coachapp-teams`, `coachapp-players`, `coachapp-trainings`, `coachapp-profile` localStorage adatok automatikusan visszaállnak, ha az adott Supabase tábla üres.
- A migráció után a Supabase szinkronizálás feltölti a visszaállított rekordokat.
- Betöltés közben a kliens nem nullázza le a meglévő state-et.
