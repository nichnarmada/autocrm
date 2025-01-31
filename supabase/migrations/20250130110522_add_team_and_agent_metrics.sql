-- Add capabilities to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS capabilities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_workload integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_workload integer DEFAULT 100;

-- Add team_id to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);

-- Create team routing metrics table
CREATE TABLE IF NOT EXISTS team_routing_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
    routing_timestamp timestamptz DEFAULT now(),
    confidence_score float DEFAULT 0,
    routing_reason text,
    workload_at_time integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add expertise and workload tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expertise text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skill_levels jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_workload integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_workload integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
    resolution_time interval,
    customer_satisfaction integer,
    complexity_score float,
    resolution_quality_score float,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add routing and assignment metadata to tickets
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS routing_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_routing_timestamp timestamptz,
ADD COLUMN IF NOT EXISTS assignment_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_assignment_timestamp timestamptz,
ADD COLUMN IF NOT EXISTS routing_confidence float,
ADD COLUMN IF NOT EXISTS assignment_confidence float;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_routing_metrics_team ON team_routing_metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_team_routing_metrics_ticket ON team_routing_metrics(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_ticket ON agent_performance_metrics(ticket_id);

-- Add RLS policies
ALTER TABLE team_routing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Team routing metrics policies
CREATE POLICY "Team routing metrics are viewable by authenticated users"
ON team_routing_metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Team routing metrics are insertable by service role"
ON team_routing_metrics FOR INSERT
TO service_role
WITH CHECK (true);

-- Agent performance metrics policies
CREATE POLICY "Agent performance metrics are viewable by authenticated users"
ON agent_performance_metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Agent performance metrics are insertable by service role"
ON agent_performance_metrics FOR INSERT
TO service_role
WITH CHECK (true);

-- Update types
DO $$ BEGIN
    CREATE TYPE ticket_routing_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 