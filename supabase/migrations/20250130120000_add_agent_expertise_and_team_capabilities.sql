-- Add expertise and skills tracking for agents
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expertise jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skill_levels jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS max_workload integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Add team capabilities and workload tracking
CREATE TABLE IF NOT EXISTS team_capabilities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    capability text NOT NULL,
    level integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add ticket resolution history for agent performance tracking
CREATE TABLE IF NOT EXISTS ticket_resolution_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES profiles(id),
    resolution_time interval,
    customer_satisfaction integer,
    complexity_level text,
    skills_utilized jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_capabilities_team ON team_capabilities(team_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resolution_agent ON ticket_resolution_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resolution_ticket ON ticket_resolution_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_profiles_expertise ON profiles USING gin (expertise);
CREATE INDEX IF NOT EXISTS idx_profiles_skill_levels ON profiles USING gin (skill_levels);

-- Add RLS policies
ALTER TABLE team_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_resolution_history ENABLE ROW LEVEL SECURITY;

-- Team capabilities policies
CREATE POLICY "Team capabilities are viewable by authenticated users"
ON team_capabilities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Team capabilities are insertable by admins and supervisors"
ON team_capabilities FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'supervisor')
    )
);

-- Ticket resolution history policies
CREATE POLICY "Ticket resolution history is viewable by authenticated users"
ON ticket_resolution_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Ticket resolution history is insertable by service role"
ON ticket_resolution_history FOR INSERT
TO service_role
WITH CHECK (true);

-- Update types
DO $$ BEGIN
    CREATE TYPE complexity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_capabilities_updated_at
    BEFORE UPDATE ON team_capabilities
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 