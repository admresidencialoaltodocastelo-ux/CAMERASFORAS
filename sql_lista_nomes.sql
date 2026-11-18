-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- Necessário para a lista suspensa de nomes no acesso do usuário.

create or replace function public.listar_usuarios()
returns table(nome text)
language sql
security definer
set search_path = public
stable
as $$
  select u.nome from public.usuarios u order by u.nome
$$;

revoke all on function public.listar_usuarios() from public;
grant execute on function public.listar_usuarios() to anon, authenticated;

notify pgrst, 'reload schema';
