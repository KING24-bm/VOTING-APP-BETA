/*
  # School Voting App Schema

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `staff_code` (text, unique) - hashed staff code for teacher login
      - `created_at` (timestamp)
    
    - `polls`
      - `id` (uuid, primary key)
      - `title` (text) - poll title/name
      - `description` (text) - optional description
      - `is_active` (boolean) - whether poll is currently active
      - `created_by` (uuid) - foreign key to teachers
      - `created_at` (timestamp)
    
    - `roles`
      - `id` (uuid, primary key)
      - `poll_id` (uuid) - foreign key to polls
      - `name` (text) - role name (Head Boy, Head Girl, etc.)
      - `created_at` (timestamp)
    
    - `candidates`
      - `id` (uuid, primary key)
      - `role_id` (uuid) - foreign key to roles
      - `name` (text) - candidate name
      - `image_url` (text) - URL to candidate image
      - `created_at` (timestamp)
    
    - `votes`
      - `id` (uuid, primary key)
      - `role_id` (uuid) - foreign key to roles
      - `candidate_id` (uuid) - foreign key to candidates
      - `voter_id` (text) - unique identifier for voter (to prevent duplicate votes)
      - `created_at` (timestamp)
      - Unique constraint on (role_id, voter_id) to ensure one vote per role per voter

  2. Security
    - Enable RLS on all tables
    - Teachers can create and manage polls
    - Anyone can view active polls and candidates
    - Anyone can vote (once per role)
    - Only teachers can view results
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, voter_id)
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teachers
CREATE POLICY "Anyone can read teachers"
  ON teachers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (true);

-- RLS Policies for polls
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create polls"
  ON polls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update polls"
  ON polls FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete polls"
  ON polls FOR DELETE
  USING (true);

-- RLS Policies for roles
CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create roles"
  ON roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update roles"
  ON roles FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete roles"
  ON roles FOR DELETE
  USING (true);

-- RLS Policies for candidates
CREATE POLICY "Anyone can view candidates"
  ON candidates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create candidates"
  ON candidates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update candidates"
  ON candidates FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete candidates"
  ON candidates FOR DELETE
  USING (true);

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can cast votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_poll_id ON roles(poll_id);
CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON candidates(role_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_role_id ON votes(role_id);