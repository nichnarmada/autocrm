-- Create a table for research findings
CREATE TABLE IF NOT EXISTS ticket_research_findings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  similar_tickets jsonb DEFAULT '[]',
  patterns jsonb DEFAULT '{}',
  suggested_solutions text[],
  frequency_score float CHECK (frequency_score >= 0 AND frequency_score <= 1),
  impact_score float CHECK (impact_score >= 0 AND impact_score <= 1),
  complexity_score float CHECK (complexity_score >= 0 AND complexity_score <= 1),
  research_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ticket_research_ticket_id 
  ON ticket_research_findings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_research_scores 
  ON ticket_research_findings(frequency_score, impact_score, complexity_score);

-- Add RLS policies
ALTER TABLE ticket_research_findings ENABLE ROW LEVEL SECURITY;

-- Agents and admins can view research findings
CREATE POLICY "agents_and_admins_can_view_research" ON ticket_research_findings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
);

-- Agents and admins can insert research findings
CREATE POLICY "agents_and_admins_can_insert_research" ON ticket_research_findings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
);

-- Agents and admins can update research findings
CREATE POLICY "agents_and_admins_can_update_research" ON ticket_research_findings
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON ticket_research_findings
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
