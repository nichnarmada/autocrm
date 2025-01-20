# AutoCRM Development Rulebook

## Database & Schema

### Database Changes

- **Never make direct changes in production**
- All database changes must follow the migration workflow
- Refer to [Supabase Practices](./supabase-practices.md) for migration guidelines

### Schema Design

- Follow the schema defined in [Database Schema](./database-schema.md)
- All tables must include:
  - UUID primary keys
  - Timestamps (created_at, updated_at)
  - Appropriate RLS policies
- Refer to [Database Schema](./database-schema.md) for:
  - Table relationships
  - Required fields
  - Data types
  - Index specifications

## API Development

### Endpoint Design

- Follow RESTful conventions
- Implement endpoints as defined in [API Specification](./api-specification.md)
- Include proper error handling and status codes
- Maintain rate limiting requirements

### Authentication & Authorization

- All endpoints require authentication except where noted
- Follow RLS policies defined in [Database Schema](./database-schema.md)
- Implement role-based access control

## Component Development

### Structure

- Components go in appropriate directories under `/components`
- `/components/ui` is **exclusively** for shadcn/ui components
- Refer to [Component Architecture](./component-architecture.md) for directory structure

### Component Rules

- Components must be purely presentational
- No API calls within components
- No direct database access
- Follow composition patterns
- Refer to [Component Architecture](./component-architecture.md) for:
  - Best practices
  - Anti-patterns
  - Code examples

## Testing Requirements

### Test Coverage

- Unit Tests: 80% coverage minimum
- Integration Tests: All critical paths
- E2E Tests: All user journeys
- Refer to [Test Plan](./test-plan.md) for:
  - Testing strategies
  - Tool usage
  - Example tests

## Feature Development

### User Stories

- All features must map to user stories
- Follow acceptance criteria
- Refer to [User Stories](./user-stories.md) for:
  - Role requirements
  - Feature specifications
  - Acceptance criteria

## Code Style & Standards

### TypeScript

- Use strict mode
- Proper type definitions
- No `any` types unless absolutely necessary

### React/Next.js

- Use Server Components by default
- Client Components only when necessary
- Follow App Router patterns

### Styling

- Use Tailwind CSS
- Follow design system tokens
- Maintain dark mode support

## Version Control

### Git Workflow

- Feature branches from `main`
- Pull requests required
- CI must pass before merge

### Database Versioning

- Use Supabase migrations
- Version control all migrations
- Never modify existing migrations

## Documentation

### Required Documentation

- API endpoints
- Database changes
- Component props
- Test cases

### Where to Find Information

1. Database Schema: [Database Schema](./database-schema.md)
2. API Design: [API Specification](./api-specification.md)
3. Component Guidelines: [Component Architecture](./component-architecture.md)
4. Testing Strategy: [Test Plan](./test-plan.md)
5. User Requirements: [User Stories](./user-stories.md)
6. Database Practices: [Supabase Practices](./supabase-practices.md)

## Getting Started

1. Read through all documentation in the following order:

   - User Stories
   - Database Schema
   - API Specification
   - Component Architecture
   - Test Plan
   - Supabase Practices

2. Set up local development:

   ```bash
   # Install dependencies
   npm install

   # Setup Supabase locally
   supabase init
   supabase start

   # Link to project
   supabase link --project-ref your-project-ref

   # Run development server
   npm run dev
   ```

3. Before submitting PR:

   - Run all tests
   - Update documentation
   - Follow migration guidelines
   - Check component rules
   - Verify API specifications

## Common Issues & Solutions

### Next.js 15

#### Async Request APIs

```ts
// Always use async versions of runtime APIs
const cookieStore = await cookies()
const headersList = await headers()
const { isEnabled } = await draftMode()

// Handle async params in layouts/pages
const params = await props.params
const searchParams = await props.searchParams
```

#### Data Fetching

- Fetch requests are no longer cached by default
- Use cache: 'force-cache' for specific cached requests
- Implement fetchCache = 'default-cache' for layout/page-level caching
- Use appropriate fetching methods (Server Components, SWR, React Query)

#### Route Handlers

```ts
import { type NextRequest } from "next/server"

// Cached route handler example
export const dynamic = "force-static"

export function GET(request: NextRequest) {
  const params = await request.params
  // Implementation
}
```

### Supabase

#### createServerClient() function

When calling the createServerClient function, do not write `get` or `set` as they are deprecated. Use `getAll` and `setAll` instead.

```ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```
