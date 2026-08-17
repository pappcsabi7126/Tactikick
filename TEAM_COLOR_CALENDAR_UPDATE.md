# TactiKick — Team-colored mobile club calendar

This version keeps the existing club calendar and mobile weekly agenda, but calendar events now use the configured team's color as their primary visual accent.

- Team color is read from `teams[].color` using `event.teamId`.
- Mobile event cards use the team's accent, border, left rail and team-name badge.
- Desktop club-calendar event blocks use the same team accent.
- Existing event-type colors remain as a fallback when an event has no matching team.
- No Supabase schema/data changes are included.
- `.env` is intentionally not included.

Before deployment:
1. Keep/copy your local `.env`.
2. Run `npm install`.
3. Run `npm run build`.
4. Commit and push `main`.
