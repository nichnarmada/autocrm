-- Enable real-time for specific tables
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_comments;

-- Enable real-time for specific columns
comment on table tickets is 'schema_version=1';
comment on table ticket_comments is 'schema_version=1';

-- Add real-time configuration
begin;
  -- Drop if exists to avoid errors on re-run
  drop publication if exists supabase_realtime;

  -- Create publication for real-time
  create publication supabase_realtime;

  -- Add tables to publication with all operations
  alter publication supabase_realtime add table tickets;
  alter publication supabase_realtime add table ticket_comments;

  -- Enable replication for tickets
  alter table tickets replica identity full;
  alter table ticket_comments replica identity full;
commit; 