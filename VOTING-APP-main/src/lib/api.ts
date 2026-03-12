import { supabase } from './supabase';
import { Poll, Candidate, Vote, User, PollWithCandidates, ApiResponse } from '../types';

class ApiService {
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (!user) {
        return { data: null, error: 'No user found', success: false };
      }
      
      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Try student table as fallback
        const { data: studentProfile, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (studentError) {
          return { data: null, error: 'User profile not found', success: false };
        }
        
        return { 
          data: { 
            id: studentProfile.id, 
            email: user.email!, 
            role: 'student',
            name: studentProfile.name
          }, 
          success: true 
        };
      }
      
      return { 
        data: { 
          id: profile.id, 
          email: user.email!, 
          role: 'teacher',
          name: profile.name
        }, 
        success: true 
      };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  async getActivePolls(): Promise<ApiResponse<Poll[]>> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .lte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [], success: true };
    } catch (error: any) {
      return { data: [], error: error.message, success: false };
    }
  }

  async getPollById(pollId: string): Promise<ApiResponse<PollWithCandidates>> {
    try {
      // Get poll details
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (pollError) throw pollError;

      // Get candidates for this poll
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('poll_id', pollId);

      if (candidatesError) throw candidatesError;

      return { 
        data: { ...poll, candidates: candidates || [] }, 
        success: true 
      };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  async submitVote(voteData: Omit<Vote, 'id' | 'voted_at'>): Promise<ApiResponse<Vote>> {
    try {
      // Check if user has already voted in this poll
      const { data: existingVote, error: existingVoteError } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', voteData.poll_id)
        .eq('student_id', voteData.student_id)
        .single();

      if (existingVote && !existingVoteError) {
        return { data: null, error: 'You have already voted in this poll', success: false };
      }

      const { data, error } = await supabase
        .from('votes')
        .insert([{
          ...voteData,
          voted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  async createPoll(pollData: Omit<Poll, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<ApiResponse<Poll>> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .insert([{
          ...pollData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  async getResults(pollId: string): Promise<ApiResponse<Candidate[]>> {
    try {
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select(`
          *,
          votes(count)
        `)
        .eq('poll_id', pollId);

      if (error) throw error;

      // Calculate vote counts
      const candidatesWithVotes = candidates.map(candidate => ({
        ...candidate,
        vote_count: candidate.votes?.[0]?.count || 0
      }));

      return { data: candidatesWithVotes, success: true };
    } catch (error: any) {
      return { data: [], error: error.message, success: false };
    }
  }
}

export const apiService = new ApiService();

