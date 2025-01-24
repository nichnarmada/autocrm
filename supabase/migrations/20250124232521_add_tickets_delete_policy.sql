-- Create policy to allow agents and admins to delete tickets
CREATE POLICY "agents_and_admins_can_delete_tickets" ON "public"."tickets"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE 
      profiles.id = auth.uid() 
      AND (profiles.role = 'agent' OR profiles.role = 'admin')
  )
);
