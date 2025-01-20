# Technical Stack & Architecture Decisions

## Core Infrastructure

- **Backend**: Supabase
  - Authentication with SSO support
  - PostgreSQL database
  - Object storage
  - Edge Functions
  - Built-in Vector store
  - Real-time data sync
  - Row Level Security (RLS)

## Frontend Stack

- **Framework**: Next.js

  - App Router for routing
  - Server Components for performance
  - API Routes for backend functionality
  - Built-in TypeScript support

- **Styling**: Tailwind CSS + shadcn/ui

  - Utility-first CSS framework
  - Customizable component system
  - Dark mode support
  - Accessible components
  - Theme customization

## Development Tools

- **Primary Development**: Lovable + Cursor combination
  - 20-50x improvement in development speed
  - Supabase API integration
  - Automated feedback loops
  - Enhanced debugging capabilities

## Source Control & Deployment

- **Version Control**: GitHub

  - Native support in development tools
  - Extensive CI/CD integration

- **Deployment**: AWS Amplify 2.0

  - Two-click GitHub integration
  - Fast deployments
  - Easy Route53 domain setup

## Recommended Testing Tools

- **Unit & Integration Testing**:

  - Vitest
    - Compatible with Next.js
    - Fast execution
    - Great TypeScript support
    - Component testing capabilities

- **E2E Testing**:

  - Playwright
    - Multi-browser support
    - API testing capabilities
    - Authentication testing
    - Great TypeScript support

- **API Testing**:

  - Supertest
    - HTTP assertions
    - Route testing
    - Great for Next.js API routes

- **Database Testing**:

  - Supabase Testing Helpers
    - Database seeding
    - Transaction support
    - Isolation between tests

## AI Framework Options

- **Recommended**: LangChain

  - Pre-built LLM integrations
  - RAG workflow support
  - Extensive documentation
  - Active community

## Agent Hosting

- **Primary**: Supabase Edge Functions

  - Deno runtime
  - JavaScript/TypeScript support
  - Local testing capability
  - Real-time updates

- **Alternative**: Amplify Cloud Functions

  - For larger LangChain agents
  - Better scaling capabilities
