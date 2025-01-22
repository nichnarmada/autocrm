-- Drop existing foreign key if exists
alter table ticket_comments
  drop constraint if exists ticket_comments_user_id_fkey;

-- Add correct foreign key to profiles
alter table ticket_comments
  add constraint ticket_comments_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete set null; 