# API Specification

## Base URL

`/api/v1`

## Authentication

All endpoints require authentication using JWT tokens except where noted.

## Response Format

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string
  } | null
}
```

## Endpoints

### Tickets

#### GET /tickets

List tickets with filtering and pagination

Query Parameters:

- `status`: Enum ['new', 'open', 'pending', 'resolved', 'closed']
- `priority`: Enum ['low', 'medium', 'high', 'urgent']
- `assigned_to`: UUID
- `team_id`: UUID
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string
- `sort`: string (e.g., "created_at:desc")

Response:

```json
{
  "data": [Ticket],
  "meta": {
    "total": number,
    "page": number,
    "limit": number
  }
}
```

#### POST /tickets

Create a new ticket

Body:

```json
{
  "title": string,
  "description": string,
  "priority": string,
  "category": string,
  "tags": string[],
  "metadata": object
}
```

#### GET /tickets/:id

Get ticket details including comments

Response:

```json
{
  "data": {
    "ticket": Ticket,
    "comments": [TicketComment]
  }
}
```

#### PATCH /tickets/:id

Update ticket details

Body:

```json
{
  "status": string,
  "priority": string,
  "assigned_to": UUID,
  "team_id": UUID,
  "metadata": object
}
```

#### POST /tickets/:id/comments

Add comment to ticket

Body:

```json
{
  "content": string,
  "is_internal": boolean,
  "attachments": [
    {
      "name": string,
      "url": string,
      "type": string
    }
  ]
}
```

#### POST /tickets/bulk

Perform bulk operations on tickets

Body:

```json
{
  "operation": "update" | "delete" | "assign",
  "ticket_ids": UUID[],
  "data": {
    "status"?: string,
    "priority"?: string,
    "assigned_to"?: UUID,
    "team_id"?: UUID
  }
}
```

### Teams

#### GET /teams

List all teams

#### POST /teams

Create a new team

Body:

```json
{
  "name": string,
  "description": string,
  "settings": object
}
```

#### PATCH /teams/:id/members

Update team members

Body:

```json
{
  "add": [
    {
      "user_id": UUID,
      "role": string
    }
  ],
  "remove": [UUID]
}
```

### Templates

#### GET /templates

List response templates

Query Parameters:

- `category`: string
- `search`: string
- `active`: boolean

#### POST /templates

Create response template

Body:

```json
{
  "title": string,
  "content": string,
  "category": string,
  "tags": string[]
}
```

### Knowledge Base

#### GET /kb/articles

List knowledge base articles

Query Parameters:

- `status`: string
- `category`: string
- `search`: string

#### POST /kb/articles

Create knowledge base article

Body:

```json
{
  "title": string,
  "content": string,
  "category": string,
  "tags": string[],
  "status": string
}
```

### Users

#### GET /users

List users with filtering

Query Parameters:

- `role`: string
- `status`: string
- `search`: string

#### POST /users

Create new user

Body:

```json
{
  "email": string,
  "full_name": string,
  "role": string,
  "team_ids": UUID[]
}
```

### System Integration

#### GET /api-keys

List API keys (admin/integrator only)

#### POST /api-keys

Create new API key (admin/integrator only)

Body:

```json
{
  "name": string,
  "permissions": string[]
}
```

#### POST /webhooks

Create webhook subscription

Body:

```json
{
  "url": string,
  "events": string[],
  "secret": string
}
```

### Analytics

#### GET /analytics/tickets

Get ticket statistics

Query Parameters:

- `start_date`: string
- `end_date`: string
- `team_id`: UUID
- `agent_id`: UUID

Response:

```json
{
  "data": {
    "total": number,
    "by_status": object,
    "by_priority": object,
    "avg_resolution_time": number,
    "satisfaction_score": number
  }
}
```

#### GET /analytics/performance

Get agent/team performance metrics

Query Parameters:

- `team_id`: UUID
- `agent_id`: UUID
- `period`: string

## Webhook Events

### Available Events

- `ticket.created`
- `ticket.updated`
- `ticket.assigned`
- `ticket.resolved`
- `ticket.commented`
- `team.updated`
- `kb.published`

### Webhook Payload Format

```json
{
  "event": string,
  "timestamp": string,
  "data": object,
  "signature": string
}
```

## Rate Limits

- 1000 requests per minute for authenticated endpoints
- 100 requests per minute for webhook deliveries
- 50 requests per minute for analytics endpoints

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

## Real-time Subscriptions

### Ticket Updates

```typescript
// Subscribe to ticket updates
supabase.channel("tickets").on("postgres_changes", {
  event: "*",
  schema: "public",
  table: "tickets",
})

// Subscribe to specific ticket
supabase.channel(`ticket_${id}`).on("postgres_changes", {
  event: "*",
  schema: "public",
  table: "tickets",
  filter: `id=eq.${id}`,
})
```
