# V16 – Heti program olvashatóság

- Javítottam a heti program esemény-pozicionálását: nem a pálya 4 lehetséges zónáját használja üres oszlopokként.
- Az egy időben futó események tényleges ütközési sávokat kapnak, ezért két esemény nem csúszik egymásra és nem kerül indokolatlanul keskeny helyre.
- Ha egyszerre 4 esemény fut, mind a 4 külön sávban jelenik meg.
- A heti táblázat szélesebb lett, vízszintes görgetéssel is kezelhető, hogy több egyidejű eseménynél olvasható maradjon.
- Az időoszlop szélesebb lett és a feliratok olvashatóbbak.
- A meglévő időskála, eseménykattintás és pályaütközés-jelzés logikáját nem változtattam.
- Nem került bele drag & drop.
