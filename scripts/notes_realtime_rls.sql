alter table "Nota" replica identity full;
alter table "Nota" enable row level security;

drop policy if exists "notes_realtime_select" on "Nota";

create policy "notes_realtime_select"
on "Nota"
for select
using (
  exists (
    select 1
    from "Morador" as m
    where m."authUserId" = auth.uid()::text
      and m."casaId" = "Nota"."casaId"
      and (
        "Nota"."escopo" = 'CASA'
        or "Nota"."moradorId" = m."id"
        or ("Nota"."escopo" = 'PESSOAL' and "Nota"."isPublica" = true)
      )
  )
);

do $$
begin
  alter publication supabase_realtime add table "Nota";
exception
  when duplicate_object then null;
end $$;
