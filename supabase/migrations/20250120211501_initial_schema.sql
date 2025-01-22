-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create types
create type user_role as enum ('admin', 'agent', 'customer');
create type ticket_status as enum ('new', 'open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type ticket_category as enum ('bug', 'feature', 'support', 'other');

-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  email text,
  role user_role not null default 'customer',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  role text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(team_id, user_id)
);

create table tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'medium',
  category ticket_category not null default 'support',
  assigned_to uuid references profiles on delete set null,
  created_by uuid references profiles on delete cascade not null,
  team_id uuid references teams on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets on delete cascade not null,
  content text not null,
  created_by uuid references profiles on delete cascade not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
); 