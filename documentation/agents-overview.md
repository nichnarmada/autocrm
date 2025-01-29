## Overview: Implementing Agents with LangChain, LangGraph, and Testing via LangSmith

Below is a high-level plan describing how to integrate multiple agents using LangChain and LangGraph in your current CRM/ticketing system.

---

### 1. Review the Existing Architecture & Requirements

1. **Database Schema and Policies**

   - Familiarize yourself with the tables and RLS (Row Level Security) policies defined in the SQL migrations (e.g., tickets, ticket_comments, ticket_attachments, AI classification columns, research findings, etc.).
   - Note which roles (admin, agent, customer) have permissions to insert, update, or delete certain records.

2. **Agent Use Cases and Flow**

   - According to the documents (like the “timeline.md” and “phase2-requirements.md”), the main AI tasks revolve around:
     - Ticket classification (Classifier Agent)
     - Research/pattern analysis (Research Agent)
     - Priority determination (Priority Agent)
     - SLA management (SLA Agent)
     - Team routing (Team Routing Agent)
     - Individual agent assignment (Agent Assignment Agent)
   - Each agent has specific triggers (e.g., new ticket creation, post-classification, scheduled checks) and writes to AI-related columns (ai_suggested_category, ai_confidence) or tables (ticket_research_findings).

3. **Test Plans**

   - You already have test cases outlined in “agent-test-cases.md,” which detail how to verify classification correctness, research accuracy, priority assignment, etc. This will be useful for your QA and integration tests.

---

### 2. Establish the LangChain & LangGraph Foundation

1. **Install/Configure LangChain**

   - Your code snippet in “agent.ts” shows usage of ChatOpenAI, createReactAgent, and a custom tool (TavilySearchResults). Update or install packages as needed:
     - @langchain/openai
     - @langchain/core
     - @langchain/langgraph
   - Confirm your environment variables and credentials for OpenAI or whichever LLM you plan to use.

2. **Create a Shared Checkpoint or Memory**

   - Initialize a MemorySaver or similar shared memory if some agents need to recall previous states. For instance, the “Classifier Agent” might pass data to the “Research Agent” in a separate invocation.
   - You can store partial results (e.g., intermediate classification outputs) in the database or in ephemeral memory (depending on your design).

3. **Design Each Agent**

   - For each agent type, define your approach:
     - **Classifier Agent**: Takes a ticket’s title/description and returns ai_suggested_category, ai_confidence, etc.
     - **Research Agent**: Gathers historical data, references your “ticket_research_findings” table.
     - **Priority/SLA Agent**: Reads the ticket plus any research data to set priority and estimated resolution times.
     - **Routing/Assignment Agent**: Recommends a team or specific user based on skill, workload, etc.

---

### 3. Integrate Supabase & Database Writes

1. **Create a Supabase Client**

   - Use a server-side approach (e.g., createServerClient from @supabase/ssr) to ensure secure RLS usage.
   - Remember to call getAll() and setAll() on cookies if you’re storing session data in Next.js 15.

2. **Map Agent Outputs to Database Fields**

   - The “tickets” table has columns like ai_suggested_category, ai_confidence, ai_classification_timestamp. When the Classifier Agent finishes, update those columns accordingly.
   - The “ticket_research_findings” table logs research insights. Insert or upsert if you’re storing new research analysis.
   - Additional fields (e.g., “priority” or “team_id”) can be updated once the Priority Agent or Team Routing Agent completes.

3. **Honor Row Level Security**

   - Make sure the authenticated role is recognized as “agent” or “admin” if the agent tries to update AI-related columns.
   - Keep consistent with the policies in your migrations (e.g., “agents_and_admins_can_update_ai_classification”).

---

### 4. Testing & Validation with LangSmith

Once each agent is implemented, plan your testing workflow:

1. **Local Unit Tests**

   - Use Jest to ensure each agent runs standalone test cases from “agent-test-cases.md.” Mock your database calls or use a local testing DB.

2. **Integration with LangSmith (or a Similar Tool)**

   - Log each agent’s requests, responses, and chain-of-thought (where appropriate).
   - Compare outcome metrics (like classification accuracy, resolution times) to the acceptance criteria (e.g., “confidence >= 0.8”).
   - Take advantage of LangSmith’s visualization to see how your chains and agents sequence tasks.

3. **E2E Testing**

   - Run a full pipeline from ticket creation → classification → research → priority → routing → assignment.
   - Gather metrics on processing time, correctness, and fallback handling.

---

### 5. Iteration and Phase 2 Expansion

1. **Parallel vs. Sequential Flow**

   - Determine if your agents can run in parallel (e.g., SLA checks happen passively) or if they must run sequentially (“Classifier → Research → Priority …”).

2. **Agent Coordination**

   - If multiple agents need orchestrating, consider a “manager” agent or a queue-based approach that triggers each specialized agent in the correct order.

3. **Performance Monitoring & Optimization**

   - Integrate logs from LangSmith or your own instrumentation.
   - Watch database indexes (like “idx_tickets_ai_classification” or “idx_ticket_research_scores”) to ensure queries remain efficient.

4. **UI Integration**

   - Surfaces the agent’s results to your support staff.
   - Provide ways to override AI decisions if the classification or priority seems incorrect.

---

## Next Steps

1. **Prototype the Classifier Agent**

   - Start small by implementing the Classifier Agent, hooking it up to the “tickets” table for read and write operations.
   - Test with sample data using the “Classifier Agent Test Cases.”

2. **Expand to the Research Agent**

   - Build or reuse a fetched data tool in your agent.
   - Store results in the “ticket_research_findings” table.
   - Validate correctness with the “Research Agent Test Cases.”

3. **Introduce Priority & SLA Agents**

   - Read classification and research data to decide priority.
   - Write priority back to the “tickets” table.
   - Enforce SLA logic with a scheduled job or event triggers.

4. **Add Routing & Assignment**

   - Route high-complexity tickets to specialized teams.
   - Insert or update “team_id” and “assigned_to” based on your matching logic.

5. **Perform Final E2E Testing**

   - Validate each step in the agent flow.
   - Debug any RLS or performance issues.
   - Iterate until all acceptance criteria are met.

---

By following these steps, you’ll have a structured process for building out the feature with LangChain, LangGraph, and Supabase. You’ll be prepared to test thoroughly using both your local testing framework and LangSmith, ensuring that each agent’s functionality meets your Phase 2 AI integration requirements. Good luck with your implementation!
