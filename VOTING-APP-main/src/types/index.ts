export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student';
  name?: string;
  created_at?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  created_by: string;
  starts_at: string;
  ends_at: string;
  max_votes: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Candidate {
  id: string;
  poll_id: string;
  name: string;
  description: string;
  vote_count: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  student_id: string;
  candidate_id?: string;
  option_text?: string;
  voted_at: string;
}

export interface PollWithCandidates extends Poll {
  candidates: Candidate[];
}

export interface ApiResponse<T> {
  data?: T | null;
  error?: string;
  success: boolean;
}

