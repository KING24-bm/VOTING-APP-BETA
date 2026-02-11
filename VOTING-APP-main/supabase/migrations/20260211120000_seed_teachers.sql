-- Seed teachers with initial staff codes
-- Run this in your Supabase SQL editor if the `teachers` table exists.

INSERT INTO teachers (staff_code)
VALUES ('STAFF123'), ('STAFF456'), ('ADMIN001')
ON CONFLICT (staff_code) DO NOTHING;

-- You can replace the values above with your actual staff codes.