# TactiKick V10 – adatmegőrzés

- Cloud + minden régi coachapp/tactikick localStorage kulcs merge-elése
- Részleges Supabase-adat esetén sem vesznek el hiányzó régi rekordok
- Supabase hiba esetén helyi biztonsági mentésből read-only recovery mód
- Recovery módban nincs automatikus sync, tehát nem írjuk felül a felhőt üres/hiányos state-tel
- Cloud rekord azonos ID esetén elsőbbséget élvez
