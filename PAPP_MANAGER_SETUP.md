# Pappcsabi7126 – Admin

A `pappcsabi7126@gmail.com` fiók a TactiKick klub **Admin** szerepkörét kapja.

Az Admin minden klubkezelési jogosultsággal rendelkezik:
- események létrehozása, szerkesztése és törlése;
- pályák kezelése;
- klubtagok meghívása és kezelése;
- klubbeállítások és klubjelvény kezelése;
- heti program kezelése és előző heti program másolása;
- a saját csapatok, játékosok és edzések teljes kezelése.

Az edzők megtekintési módban használják a klub központi heti programját.

A frontend az Admin szerepkört az `admin` értékkel kezeli, a régi `professional_manager` / `szakmai vezető` értékeket pedig visszamenőleg admin jogosultságként felismeri.

A valódi adatbázis-biztonságot továbbra is a Supabase RLS adja; az UI-ban látható jogosultság önmagában nem biztonsági határ.

A projekt `.env` fájlja nincs a ZIP-ben. A saját lokális `.env` fájlodat tartsd meg.
