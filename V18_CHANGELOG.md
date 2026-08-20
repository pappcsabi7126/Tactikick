# CoachOS V18

## Javítások
- Az Edzés / Jelenléti ív választóablak világos témában is világos, olvasható felületet kapott; nem marad sötét.
- A havi Jelenlét oldalon új `PDF jelenléti ív` gomb került a hónap navigáció mellé.
- A PDF az éppen kiválasztott hónapot és csapatot exportálja.
- Ha `Minden csapat` van kiválasztva, a PDF a csapat nevét is külön oszlopban tartalmazza.
- A PDF fekvő A4-es, hogy a havi edzésoszlopok olvashatók maradjanak.
- A havi jelenléti táblázat edzései is legfrissebbtől a legrégebbi felé rendeződnek.
- A meglévő Edzések oldali edzésválasztó logikát és a Klub heti program logikáját nem módosítottam ebben a körben.


## V18.1 PDF javítás
- A havi jelenléti PDF táblázata kisebb, A4 fekvő laphoz biztosan beférő dokumentumszélességet használ.
- Csökkentett padding és betűméret, hogy a jobb szélső oszlop se vágódjon le.
- A PDF html2canvas beállítása stabilabb lett.
