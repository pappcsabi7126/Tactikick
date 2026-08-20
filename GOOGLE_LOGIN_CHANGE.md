# Google login change

- Google OAuth is already wired through Supabase in this project.
- The OAuth redirect now preserves the exact current CoachOS route, instead of always returning to the site root.
- Example: starting Google login on `/club` returns to `/club`; starting on `/team/<id>` returns to that team.
- The login button no longer carries the old Discord CSS class name.
- No Supabase data, attendance, calendar, PDF, or mobile logic was changed.
