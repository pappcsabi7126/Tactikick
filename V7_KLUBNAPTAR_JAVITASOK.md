# TactiKick V7 – klubnaptár

## Új funkciók
- Heti program: „Előző hét másolása”
- Egy eseményhez több pálya/helyszín is kijelölhető
- Pályánként 4 kezelhető pályarész
- Több pályarész kiválasztása egy edzéshez (pl. Műfű 1 + 2)
- Pályarész-alapú ütközésvizsgálat
- Egyetlen pályarész közös használata ütközésnek számít
- Teljes pálya foglalása akkor is ütközik, ha a másik esemény csak egy részét használja
- Eseményre kattintva először részletező nézet jelenik meg
- Részletezőben pályarajz és kiemelt területek
- Csak külön „Edzés szerkesztése” gombbal nyílik meg a szerkesztő
- Edzés célja és megjegyzése megjelenik a részletezőben
- Több helyszín esetén külön pályarajz jelenik meg
- Régi, egyetlen `pitchId` alapú események kompatibilisen betöltődnek

## Indítás
```cmd
npm install
npm run dev
```

Production push előtt:
```cmd
npm run build
```

A projektet szándékosan `node_modules` és `dist` nélkül csomagoltuk.
