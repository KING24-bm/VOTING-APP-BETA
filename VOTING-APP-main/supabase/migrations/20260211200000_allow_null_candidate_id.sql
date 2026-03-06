-- Allow NULL values for candidate_id in votes table to support NOTA votes
ALTER TABLE votes ALTER COLUMN candidate_id DROP NOT NULL;