-- Drop any existing policies
drop policy if exists "Users can view ticket comments" on ticket_comments;
drop policy if exists "Users can create ticket comments" on ticket_comments;
drop policy if exists "Users can update own comments" on ticket_comments;
drop policy if exists "Admins can manage all comments" on ticket_comments;

-- Add RLS policies for ticket comments
create policy "Users can view ticket comments"
  on ticket_comments for select
  using (
    -- Users can view comments on tickets they have access to
    exists (
      select 1 from tickets
      where tickets.id = ticket_comments.ticket_id
      and (
        -- Ticket creator
        tickets.created_by = auth.uid() or
        -- Assigned agent
        tickets.assigned_to = auth.uid() or
        -- Team member
        tickets.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    ) and (
      -- For internal comments, must be team member or admin
      (is_internal = false) or
      (
        is_internal = true and
        exists (
          select 1 from profiles
          where id = auth.uid()
          and (
            role = 'admin' or
            role = 'agent'
          )
        )
      )
    )
  );

create policy "Users can create ticket comments"
  on ticket_comments for insert
  with check (
    -- Can only comment on tickets they have access to
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        tickets.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    ) and (
      -- Only agents/admins can create internal comments
      (is_internal = false) or
      (
        is_internal = true and
        exists (
          select 1 from profiles
          where id = auth.uid()
          and (
            role = 'admin' or
            role = 'agent'
          )
        )
      )
    )
  );

create policy "Users can update own comments"
  on ticket_comments for update
  using (
    -- Can only update own comments
    user_id = auth.uid()
  );

create policy "Admins can manage all comments"
  on ticket_comments for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Add indexes for performance
create index if not exists idx_ticket_comments_ticket_id on ticket_comments(ticket_id);
create index if not exists idx_ticket_comments_user_id on ticket_comments(user_id);
create index if not exists idx_ticket_comments_created_at on ticket_comments(created_at desc);

-- Add attachments support
alter table ticket_comments
  add column if not exists attachments jsonb default '[]'::jsonb;

comment on column ticket_comments.attachments is 'Array of attachment objects with name, url, and type'; 