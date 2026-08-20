# CoachOS V12 – klub / edzés UX javítások

## Javítva
- Edzéslista: legfrissebb dátum + időpont kerül előre.
- Jelenléti edzésválasztó: legfrissebb edzés kerül előre.
- Havi jelenléti nézet: az edzésoszlopok is csökkenő dátum/idő szerint jelennek meg.
- Edzésre kattintva a Klub nézetben választóablak jelenik meg:
  - Edzés megnyitása
  - Jelenlét szerkesztése
  - Mégse
- A jelenlét szerkesztése közvetlenül az adott csapat adott edzésének jelenlétére visz, ha az edzés azonosítható.
- Pálya/pályarész UI: pályarész bepipálásakor automatikusan bepipálódik a pálya; a pálya kikapcsolásakor a pályarészek is kikapcsolódnak.
- Az utolsó használat alapján a rendszer alapértelmezett pályát ajánl fel az új klubedzésnél.
- Pályaütközés csak figyelmeztetés: menteni továbbra is lehet. Tehát két csapat ugyanazt a pályát is használhatja, ha az edző ezt akarja.
- Nem került bele drag & drop, gyors edzés létrehozás vagy jelenléti összesítés.
- A meglévő Supabase/auth és egyéb működő funkciókat nem módosítottuk.

## Fontos
A buildet ebben a környezetben nem tudtam végigfuttatni, mert a projekt eredeti `node_modules` csomagjai nem voltak teljesek, és a dependency újratelepítése itt időtúllépésbe futott. A módosított JSX fájloknál a kapcsos zárójelek és zárójelek száma kiegyensúlyozott.
