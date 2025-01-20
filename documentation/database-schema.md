# Database Schema Design

## Core Data Models

### Users

- `id`: UUID (primary key)
- `email`: String (unique)
- `full_name`: String
- `role`: Enum ['admin', 'agent', 'customer', 'integrator', 'content_manager', 'architect']
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `last_login`: Timestamp
- `status`: Enum ['active', 'inactive', 'suspended']
- `preferences`: JSONB (UI preferences, notifications settings)

### Teams

- `id`: UUID (primary key)
- `name`: String
- `description`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `settings`: JSONB (team-specific configurations)

### TeamMembers

- `id`: UUID (primary key)
- `team_id`: UUID (foreign key to Teams)
- `user_id`: UUID (foreign key to Users)
- `role`: Enum ['leader', 'member']
- `joined_at`: Timestamp

### Tickets

- `id`: UUID (primary key)
- `title`: String
- `description`: Text
- `status`: Enum ['new', 'open', 'pending', 'resolved', 'closed']
- `priority`: Enum ['low', 'medium', 'high', 'urgent']
- `created_by`: UUID (foreign key to Users)
- `assigned_to`: UUID (foreign key to Users, nullable)
- `team_id`: UUID (foreign key to Teams, nullable)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `resolved_at`: Timestamp
- `category`: String
- `tags`: String[]
- `metadata`: JSONB (custom fields)

### TicketComments

- `id`: UUID (primary key)
- `ticket_id`: UUID (foreign key to Tickets)
- `user_id`: UUID (foreign key to Users)
- `content`: Text
- `is_internal`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `attachments`: JSONB[]

### ResponseTemplates

- `id`: UUID (primary key)
- `title`: String
- `content`: Text
- `category`: String
- `tags`: String[]
- `created_by`: UUID (foreign key to Users)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `version`: Integer
- `is_active`: Boolean

### KnowledgeBase

- `id`: UUID (primary key)
- `title`: String
- `content`: Text
- `category`: String
- `tags`: String[]
- `created_by`: UUID (foreign key to Users)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `status`: Enum ['draft', 'published', 'archived']
- `views`: Integer

### ApiKeys

- `id`: UUID (primary key)
- `name`: String
- `key_hash`: String
- `created_by`: UUID (foreign key to Users)
- `created_at`: Timestamp
- `last_used`: Timestamp
- `permissions`: String[]
- `is_active`: Boolean

### Webhooks

- `id`: UUID (primary key)
- `url`: String
- `events`: String[]
- `created_by`: UUID (foreign key to Users)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `is_active`: Boolean
- `secret_hash`: String

## Core Functionality Requirements

### Ticket Management

1. Enable full-text search across tickets
2. Implement ticket assignment logic
3. Support custom fields via JSONB
4. Enable ticket categorization and tagging
5. Track ticket lifecycle timestamps

### Team Management

1. Support hierarchical team structures
2. Enable team-specific settings
3. Track team member roles and permissions
4. Support team-based ticket routing

### Template Management

1. Version control for templates
2. Category-based organization
3. Support for rich text content
4. Track template usage statistics

### Knowledge Base

1. Full-text search capability
2. Version control for articles
3. View tracking and analytics
4. Category and tag organization

## Authorization Requirements (RLS Policies)

### Ticket Access

```sql
-- Customers can only view their own tickets
create policy "Customers view own tickets"
on tickets for select
to authenticated
using (auth.uid() = created_by);

-- Agents can view tickets assigned to them or their team
create policy "Agents view assigned tickets"
on tickets for select
to authenticated
using (
  auth.uid() = assigned_to
  or team_id in (
    select team_id from team_members
    where user_id = auth.uid()
  )
);

-- Admins can view all tickets
create policy "Admins view all tickets"
on tickets for all
to authenticated
using (
  exists (
    select 1 from users
    where id = auth.uid()
    and role = 'admin'
  )
);
```

### Template Access

```sql
-- Content managers and admins can manage templates
create policy "Manage templates"
on response_templates for all
to authenticated
using (
  exists (
    select 1 from users
    where id = auth.uid()
    and role in ('admin', 'content_manager')
  )
);

-- Agents can view active templates
create policy "View templates"
on response_templates for select
to authenticated
using (is_active = true);
```

### API Key Management

```sql
-- Only system integrators and admins can manage API keys
create policy "Manage API keys"
on api_keys for all
to authenticated
using (
  exists (
    select 1 from users
    where id = auth.uid()
    and role in ('admin', 'integrator')
  )
);
```

## Indexes and Performance Considerations

1. Full-text search indexes on:

   - Tickets (title, description)
   - Knowledge Base (title, content)
   - Response Templates (title, content)

2. B-tree indexes on:

   - All foreign key columns
   - Status and priority fields
   - Created_at timestamps

3. GiST indexes for tag searching
4. Partial indexes for:

   - Active tickets
   - Published knowledge base articles
   - Active templates

## Data Integrity Rules

1. Cascading deletes for related records
2. Timestamp triggers for updated_at fields
3. Validation checks for enum fields
4. Unique constraints on email addresses and API keys
5. Check constraints on status transitions

## Migration Strategy

### Schema Migrations

- Use Supabase migrations for version control
- Follow semantic versioning
- Include rollback scripts

### Data Migrations

- Support incremental updates
- Handle data transformations
- Maintain data integrity

### Example Migration

```sql
-- Migration: Add custom fields support
create table custom_fields (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  field_type text not null,
  options jsonb,
  created_at timestamp with time zone default now()
);
```
