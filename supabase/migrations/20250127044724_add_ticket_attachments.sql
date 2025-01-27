-- Create storage bucket for ticket attachments
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false);

-- Set up storage policies for ticket attachments bucket
create policy "Users can upload ticket attachments"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ticket-attachments' and
  (auth.uid() = owner)
);

create policy "Users can view ticket attachments"
on storage.objects for select
to authenticated
using (
  bucket_id = 'ticket-attachments' and
  (
    -- Check if user has access to the related ticket
    exists (
      select 1 from tickets
      where id::text = (storage.foldername(name))[1]
      and (
        created_by = auth.uid() or
        assigned_to = auth.uid() or
        customer_id = auth.uid() or
        team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    )
  )
);

-- Create ticket_attachments table
create table public.ticket_attachments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.ticket_attachments enable row level security;

-- Create or replace the handle_updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger
create trigger handle_updated_at before update on public.ticket_attachments
  for each row execute procedure public.handle_updated_at();

-- RLS Policies for ticket_attachments

-- View policy: Users can view attachments of tickets they have access to
create policy "Users can view ticket attachments"
on public.ticket_attachments for select
to authenticated
using (
  exists (
    select 1 from tickets
    where tickets.id = ticket_attachments.ticket_id
    and (
      tickets.created_by = auth.uid() or
      tickets.assigned_to = auth.uid() or
      tickets.customer_id = auth.uid() or
      tickets.team_id in (
        select team_id from team_members
        where user_id = auth.uid()
      )
    )
  )
);

-- Insert policy: Users can add attachments to tickets they have access to
create policy "Users can add ticket attachments"
on public.ticket_attachments for insert
to authenticated
with check (
  exists (
    select 1 from tickets
    where tickets.id = ticket_id
    and (
      tickets.created_by = auth.uid() or
      tickets.assigned_to = auth.uid() or
      tickets.customer_id = auth.uid() or
      tickets.team_id in (
        select team_id from team_members
        where user_id = auth.uid()
      )
    )
  )
);

-- Delete policy: Only the uploader, agents, or admins can delete attachments
create policy "Users can delete own ticket attachments"
on public.ticket_attachments for delete
to authenticated
using (
  uploaded_by = auth.uid() or
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'agent')
  )
);

-- Create indexes for better performance
create index idx_ticket_attachments_ticket_id on public.ticket_attachments(ticket_id);
create index idx_ticket_attachments_uploaded_by on public.ticket_attachments(uploaded_by);
