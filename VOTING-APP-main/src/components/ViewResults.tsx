import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trophy, Users } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  image_url: string;
  vote_count: number;
}

interface Role {
  id: string;
  name: string;
  candidates: Candidate[];
}

interface Poll {
  id: string;
  title: string;
  roles: Role[];
}

interface ViewResultsProps {
  onBack: () => void;
}

export default function ViewResults({ onBack }: ViewResultsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  useEffect(() => {
    if (selectedPollId) {
      fetchResults(selectedPollId);
      const interval = setInterval(() => fetchResults(selectedPollId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedPollId]);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setPolls(data.map(p => ({ ...p, roles: [] })));
        setSelectedPollId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async (pollId: string) => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('poll_id', pollId);

      if (rolesError) throw rolesError;

      const rolesWithCandidates = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: candidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('id, name, image_url')
            .eq('role_id', role.id);

          if (candidatesError) throw candidatesError;

          const candidatesWithVotes = await Promise.all(
            (candidates || []).map(async (candidate) => {
              const { count, error: countError } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', candidate.id);

              if (countError) throw countError;

              return {
                ...candidate,
                vote_count: count || 0,
              };
            })
          );

          candidatesWithVotes.sort((a, b) => b.vote_count - a.vote_count);

          return {
            ...role,
            candidates: candidatesWithVotes,
          };
        })
      );

      setPolls((prevPolls) =>
        prevPolls.map((p) =>
          p.id === pollId ? { ...p, roles: rolesWithCandidates } : p
        )
      );
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const selectedPoll = polls.find((p) => p.id === selectedPollId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Poll Results</h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading results...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No polls created yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Poll
                </label>
                <select
                  value={selectedPollId}
                  onChange={(e) => setSelectedPollId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {polls.map((poll) => (
                    <option key={poll.id} value={poll.id}>
                      {poll.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPoll && selectedPoll.roles.length > 0 ? (
                <div className="space-y-8">
                  {selectedPoll.roles.map((role) => (
                    <div key={role.id} className="border-2 border-gray-200 rounded-xl p-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">{role.name}</h2>

                      <div className="space-y-4">
                        {role.candidates.map((candidate, index) => {
                          const isWinner = index === 0 && candidate.vote_count > 0;
                          const totalVotes = role.candidates.reduce((sum, c) => sum + c.vote_count, 0);
                          const percentage = totalVotes > 0
                            ? Math.round((candidate.vote_count / totalVotes) * 100)
                            : 0;

                          return (
                            <div
                              key={candidate.id}
                              className={`flex items-center gap-4 p-4 rounded-xl transition ${
                                isWinner
                                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400'
                                  : 'bg-gray-50'
                              }`}
                            >
                              {candidate.image_url && (
                                <img
                                  src={candidate.image_url}
                                  alt={candidate.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {candidate.name}
                                  </h3>
                                  {isWinner && (
                                    <Trophy className="w-5 h-5 text-yellow-600" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isWinner ? 'bg-yellow-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <span className="font-semibold text-gray-800">
                                      {candidate.vote_count}
                                    </span>
                                    <span className="text-gray-600 text-sm">
                                      ({percentage}%)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Total votes: {role.candidates.reduce((sum, c) => sum + c.vote_count, 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No roles or candidates in this poll yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
