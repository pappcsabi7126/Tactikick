-- Supabase SQL Editor: ezzel gyorsan ellenőrizheted, hogy az adatok tényleg ott vannak-e.
-- A saját bejelentkezett user UUID-jét használd az auth.users táblából.

select id, email from auth.users order by created_at desc;

-- Ezután cseréld ki a USER_UUID értéket a saját user ID-dra:
-- select count(*) as teams from public.teams where user_id = 'USER_UUID';
-- select count(*) as players from public.players where user_id = 'USER_UUID';
-- select count(*) as trainings from public.trainings where user_id = 'USER_UUID';

-- Részletes lista:
-- select id, name, age, color from public.teams where user_id = 'USER_UUID' order by created_at;
-- select id, team_id, name, jersey_number from public.players where user_id = 'USER_UUID' order by created_at;
-- select id, team_id, date, start_time, end_time, title from public.trainings where user_id = 'USER_UUID' order by date, start_time;
