-- TactiKick: grant the primary account the Admin role.
-- Run this once in Supabase SQL Editor.

update public.profiles
set role = 'admin',
    updated_at = now()
where lower(email) = 'pappcsabi7126@gmail.com';

-- Verify the result:
select id, email, name, role
from public.profiles
where lower(email) = 'pappcsabi7126@gmail.com';
