# V9 – adatmegőrzési javítás

A V8-ban a csapat/játékos/edzés állapot már nem indult a régi `coachapp-*` localStorage adatokból.
Ez azt eredményezhette, hogy a korábbi böngészőben meglévő adatok eltűntnek látszottak.

A V9:
- Supabase-ból tölt, ha van felhős adat.
- Ha valamelyik tábla üres, a régi `coachapp-*` localStorage adatait visszaállítja.
- A visszaállított adatot a normál Supabase sync feltölti.
- Betöltéskor nem üríti ki előre a React state-et.
- A meglévő Supabase adatot nem cseréli le localStorage-ra, ha az adott tábla már tartalmaz adatot.
