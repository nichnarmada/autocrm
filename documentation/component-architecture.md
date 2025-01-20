# Component Architecture Guidelines

## Directory Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui components only
│   ├── common/           # Shared components across features
│   ├── tickets/          # Feature-specific components
│   ├── teams/
│   └── analytics/
```

## Core Principles

### 1. Component Purity

- Components should be pure presentational units
- No API calls or data fetching within components
- Data should be passed via props
- Use composition over direct integration

### 2. UI Component Isolation

- `/components/ui` directory is exclusively for shadcn/ui components
- No business logic in UI components
- No modifications to shadcn/ui source code
- Extend through composition rather than modification

### 3. Data Handling

```typescript
// ❌ Bad Practice
function TicketList() {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    fetch('/api/tickets').then(...)
  }, [])

  return <div>{/* render tickets */}</div>
}

// ✅ Good Practice
function TicketList({ tickets, onStatusChange }) {
  return <div>{/* render tickets */}</div>
}

// Data fetching happens in page/layout components
function TicketsPage() {
  const { data: tickets } = useQuery('tickets', fetchTickets)
  return <TicketList tickets={tickets} onStatusChange={handleStatusChange} />
}
```

### 4. Component Organization

- Group related components by feature
- Share common components across features
- Keep component files focused and single-purpose
- Use index files for clean exports

### 5. State Management

- Components should not manage global state
- Use props for component state
- Delegate state management to containers/pages
- Keep component state minimal and focused

### 6. Reusability Guidelines

- Design components for reuse across different contexts
- Use TypeScript interfaces for prop definitions
- Document component usage with comments
- Include example usage in comments

### 7. Component Composition

```typescript
// ✅ Good Practice
function TicketCard({ ticket, actions }) {
  return (
    <Card>
      <CardHeader>{ticket.title}</CardHeader>
      <CardContent>{ticket.description}</CardContent>
      <CardFooter>{actions}</CardFooter>
    </Card>
  )
}

// Usage
<TicketCard
  ticket={ticketData}
  actions={<TicketActions onUpdate={handleUpdate} />}
/>
```

### 8. Event Handling

- Pass event handlers via props
- Use consistent naming conventions
- Keep handlers focused on UI events only
- Delegate business logic to containers

### 9. Styling

- Use Tailwind classes for styling
- Keep styled components in ui/ directory
- Use CSS modules for complex custom styling
- Follow design system tokens

### 10. Testing

- Test components in isolation
- Mock all external dependencies
- Focus on component behavior
- Use testing-library best practices

## Anti-patterns to Avoid

1. ❌ API calls within components
2. ❌ Direct global state manipulation
3. ❌ Complex business logic in components
4. ❌ Modifying shadcn/ui components directly
5. ❌ Deep component nesting
6. ❌ Large, monolithic components
7. ❌ Tight coupling between components

## Best Practices

1. ✅ Small, focused components
2. ✅ Clear prop interfaces
3. ✅ Consistent naming conventions
4. ✅ Documentation and examples
5. ✅ Proper error boundaries
6. ✅ Accessibility considerations
7. ✅ Performance optimization
