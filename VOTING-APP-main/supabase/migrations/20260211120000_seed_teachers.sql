-- Seed teachers with initial usernames and passwords
-- Run this in your Supabase SQL editor if the 	eachers table exists.

INSERT INTO teachers (username, password, staff_code)
VALUES
  ('teacher1', 'pass1', 'STAFF123'),
  ('teacher2', 'pass2', 'STAFF456'),
  ('admin', 'adminpw', 'ADMIN001')
ON CONFLICT (username) DO NOTHING;

-- You can replace the values above with real credentials in a secure
-- manner; passwords are stored in plaintext here only for example purposes.
