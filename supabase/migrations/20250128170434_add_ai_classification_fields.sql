-- Add AI classification fields to tickets table
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS ai_suggested_category ticket_category,
  ADD COLUMN IF NOT EXISTS ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ADD COLUMN IF NOT EXISTS ai_classification_timestamp TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN tickets.ai_suggested_category IS 'AI suggested category for the ticket';
COMMENT ON COLUMN tickets.ai_confidence IS 'Confidence score of AI classification (0-1)';
COMMENT ON COLUMN tickets.ai_classification_timestamp IS 'Timestamp when AI classification was last updated';

-- Create index for faster queries on AI fields
CREATE INDEX IF NOT EXISTS idx_tickets_ai_classification 
  ON tickets (ai_suggested_category, ai_confidence);

-- Update RLS policies to allow agents and admins to update AI fields
CREATE POLICY "agents_and_admins_can_update_ai_classification" ON "public"."tickets"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE 
      profiles.id = auth.uid() 
      AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE 
      profiles.id = auth.uid() 
      AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
);
