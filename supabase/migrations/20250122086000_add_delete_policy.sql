-- Add delete policy for ticket comments
create policy "Users can delete own comments"
  on ticket_comments for delete
  using (
    -- Can only delete own comments
    user_id = auth.uid()
  ); 