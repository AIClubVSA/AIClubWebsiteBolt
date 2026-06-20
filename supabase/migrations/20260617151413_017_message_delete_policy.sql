-- Allow senders to delete their own messages
CREATE POLICY "delete_own_sent_messages" ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Allow admins to also delete messages sent to them (student messages)
CREATE POLICY "admin_delete_received_messages" ON messages FOR DELETE
  TO authenticated
  USING (
    receiver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
