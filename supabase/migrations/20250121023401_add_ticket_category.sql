-- Create ticket category enum
create type ticket_category as enum (
  'bug',
  'feature_request',
  'support',
  'question',
  'documentation',
  'enhancement',
  'other'
);

-- Add category column to tickets table
alter table tickets add column category ticket_category not null default 'other';

-- Update existing tickets to have a default category
update tickets set category = 'other' where category is null; 