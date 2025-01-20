# Supabase Development Best Practices

## Migration Guidelines

1. **Always Use Migrations**

   - Never make direct changes in production
   - Each change should be a versioned migration
   - Include both "up" and "down" migrations

2. **Migration Naming**

   - Use descriptive names: `[timestamp]_action_table_name.sql`
   - Example: `20240321084523_create_tickets_table.sql`

3. **Migration Content**

   - One logical change per migration
   - Include RLS policies with table creation
   - Add helpful comments
   - Test down migrations

4. **Version Control**
   - Commit migrations to git
   - Never modify existing migrations
   - Create new migrations for changes

## Development Workflow

1. **Local Development**

   ```bash
   # Start fresh
   supabase db reset

   # Make changes
   supabase migration new my_change

   # Test changes
   supabase migration up
   ```

2. **Team Collaboration**

   - Pull latest migrations before creating new ones
   - Resolve conflicts at migration level
   - Use feature branches for major schema changes

3. **Production Deployment**
   - Test migrations in staging first
   - Schedule breaking changes
   - Have rollback plan ready

## Database Design

1. **RLS Policies**

   - Include in same migration as table creation
   - Test all CRUD operations
   - Document policy intentions

2. **Types and Enums**

   ```sql
   -- Create types in separate migration
   create type ticket_status as enum (
     'new',
     'open',
     'pending',
     'resolved',
     'closed'
   );
   ```

3. **Indexes**
   - Create with table when possible
   - Separate migration for adding later
   - Document performance implications

## Common Patterns

1. **Timestamps**

   ```sql
   -- Add to all tables
   created_at timestamp with time zone default now(),
   updated_at timestamp with time zone default now()
   ```

2. **Trigger Functions**

   ```sql
   -- Update timestamp trigger
   create function update_updated_at()
   returns trigger as $$
   begin
     new.updated_at = now();
     return new;
   end;
   $$ language plpgsql;
   ```

3. **Foreign Keys**
   ```sql
   -- Always include on delete behavior
   references users(id) on delete cascade
   ```

## Testing

1. **Local Testing**

   - Test migrations in local environment
   - Verify RLS policies
   - Check foreign key constraints

2. **Seed Data**
   ```sql
   -- Create seed data for testing
   insert into tickets (title, status)
   values
     ('Test Ticket 1', 'new'),
     ('Test Ticket 2', 'open');
   ```

## Monitoring

1. **Track Migration Status**

   ```bash
   # View migration status
   supabase migration list
   ```

2. **Database Health**
   - Monitor table sizes
   - Check index usage
   - Watch query performance
