-- Check if the constraint doesn't exist before adding it
do $$ 
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'team_members_user_id_fkey'
    and table_name = 'team_members'
  ) then
    alter table "public"."team_members" 
      add constraint "team_members_user_id_fkey" 
      foreign key ("user_id") 
      references "public"."profiles"("id") 
      on delete cascade;
  end if;
end $$; 