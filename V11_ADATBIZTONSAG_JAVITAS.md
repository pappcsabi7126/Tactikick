# TactiKick V11 – adatbiztonsági javítás

## Mi volt a valódi hiba?
A korábbi V10 adatmentése több ponton veszélyes volt:
- a `teams` mentés `age_group` mezőt küldött, miközben a jelenlegi schema `age` mezőt használ;
- a `trainings` mentés nem létező legacy oszlopokat is küldött;
- a korábbi sync képes volt a kliens állapota alapján törölni felhős sorokat;
- a régi `tactikick-*` localStorage mentést nem mindig olvasta vissza;
- részleges Supabase-adat és régi browser backup esetén nem történt biztonságos összeolvasztás.

## V11 működése
- Supabase az elsődleges adatforrás.
- A régi `tactikick-*` és `coachapp-*` browser backup automatikusan visszaolvasható.
- Cloud + local adatok ID alapján összeolvadnak; az azonos ID-nél a cloud nyer.
- A sikeres betöltés után a teljes állapot külön browser backupként is megmarad.
- Üres/hibás React state többé nem törölhet automatikusan Supabase adatot.
- Explicit törlés külön Supabase delete műveleten keresztül történik.
- A teams mentés a jelenlegi `age` schema mezőt használja, és régi `age_group` schema esetén kompatibilitási retry van.
- A trainings mentés a jelenlegi schema mezőit használja.
- Supabase olvasási hiba esetén, ha van helyi backup, az app recovery módban megnyílik és nem indít automatikus cloud sync-et.

## Ellenőrzés
Minden `src/*.js` és `src/*.jsx` fájl TypeScript parserrel syntax-ellenőrizve.

A gépen futtasd:

```cmd
npm install
npm run build
```

Production push csak sikeres build után.
