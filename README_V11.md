# TactiKick V11

Ez a verzió az adateltűnési problémát kezeli.

### Fő javítások
- Supabase + local backup biztonságos merge
- `tactikick-*` és `coachapp-*` legacy adatok visszaolvasása
- nem destruktív automatikus sync
- explicit törlés külön Supabase művelettel
- `teams.age` schema javítás
- trainings schema tisztítása
- részleges Supabase-adat sem nullázza le a meglévő böngészős adatot
- recovery mód Supabase olvasási hiba esetére

### Indítás
```cmd
npm install
npm run dev
```

### Production előtt
```cmd
npm run build
```
