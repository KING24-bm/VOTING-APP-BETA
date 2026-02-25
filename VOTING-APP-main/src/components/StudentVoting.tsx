import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Vote, CheckCircle, User } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  image_url: string;
  logo_url: string;          // added
}

interface Role {
  id: string;
  name: string;
  candidates: Candidate[];
}

interface Poll {
  id: string;
  title: string;
  description: string;
  roles: Role[];
}

export default function StudentVoting() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [voterId, setVoterId] = useState<string>('');
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submittedRoles, setSubmittedRoles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedVoterId = localStorage.getItem('voterId');
    if (!storedVoterId) {
      const newVoterId = `voter_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('voterId', newVoterId);
      setVoterId(newVoterId);
    } else {
      setVoterId(storedVoterId);
    }

    fetchPolls();
  }, []);

  useEffect(() => {
    if (selectedPollId && voterId) {
      checkExistingVotes(selectedPollId);
    }
  }, [selectedPollId, voterId]);

  const fetchPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('id, title, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      if (pollsData && pollsData.length > 0) {
        const pollsWithRoles = await Promise.all(
          pollsData.map(async (poll) => {
            const { data: roles, error: rolesError } = await supabase
              .from('roles')
              .select('id, name')
              .eq('poll_id', poll.id);

            if (rolesError) throw rolesError;

            const rolesWithCandidates = await Promise.all(
              (roles || []).map(async (role) => {
                const { data: candidates, error: candidatesError } = await supabase
                  .from('candidates')
                  .select('id, name, image_url, logo_url') // include logo_url
                  .eq('role_id', role.id);

                if (candidatesError) throw candidatesError;

                return {
                  ...role,
                  candidates: candidates || [],
                };
              })
            );

            return {
              ...poll,
              roles: rolesWithCandidates,
            };
          })
        );

        setPolls(pollsWithRoles);
        setSelectedPollId(pollsWithRoles[0].id);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingVotes = async (pollId: string) => {
    try {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return;

      const roleIds = poll.roles.map((r) => r.id);
      const { data: existingVotes, error } = await supabase
        .from('votes')
        .select('role_id, candidate_id')
        .eq('voter_id', voterId)
        .in('role_id', roleIds);

      if (error) throw error;

      const votedRoles = new Set<string>();
      const voteMap: Record<string, string> = {};

      existingVotes?.forEach((vote) => {
        votedRoles.add(vote.role_id);
        voteMap[vote.role_id] = vote.candidate_id;
      });

      setSubmittedRoles(votedRoles);
      setVotes(voteMap);
    } catch (error) {
      console.error('Error checking existing votes:', error);
    }
  };

  const handleVote = (roleId: string, candidateId: string) => {
    if (submittedRoles.has(roleId)) return;
    setVotes({ ...votes, [roleId]: candidateId });
  };

  const submitVote = async (roleId: string) => {
    setError('');

    const candidateId = votes[roleId];
    if (!candidateId) {
      setError('Please select a candidate before voting');
      return;
    }

    try {
      const { error: voteError } = await supabase.from('votes').insert({
        role_id: roleId,
        candidate_id: candidateId,
        voter_id: voterId,
      });

      if (voteError) {
        if (voteError.code === '23505') {
          setError('You have already voted for this role');
        } else {
          throw voteError;
        }
        return;
      }

      setSubmittedRoles(new Set([...submittedRoles, roleId]));
      setError('');
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Failed to submit vote. Please try again.');
    }
  };

  const generateNewVoterId = () => {
    const newVoterId = `voter_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('voterId', newVoterId);
    setVoterId(newVoterId);
  };

  const handleNextVoter = () => {
    generateNewVoterId();
    setVotes({});
    setSubmittedRoles(new Set());
    setError('');
  };

  const selectedPoll = polls.find((p) => p.id === selectedPollId);
  const allRolesVoted =
    selectedPoll &&
    selectedPoll.roles.length > 0 &&
    submittedRoles.size === selectedPoll.roles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <img src="/images/euroschool-logo.png" alt="EuroSchool North Campus" className="h-16 w-16 object-contain cursor-pointer mb-8" onClick={() => window.location.href = "/"} />
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-4 rounded-full">
              <Vote className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Student Voting</h1>
          <p className="text-gray-600">Cast your vote for each role</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-600">No active polls available at the moment.</p>
          </div>
        ) : (
          <>
            {polls.length > 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Poll
                </label>
                <select
                  value={selectedPollId}
                  onChange={(e) => setSelectedPollId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {polls.map((poll) => (
                    <option key={poll.id} value={poll.id}>
                      {poll.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPoll && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedPoll.title}
                  </h2>
                  {selectedPoll.description && (
                    <p className="text-gray-600">{selectedPoll.description}</p>
                  )}
                </div>

                {selectedPoll.roles.map((role) => {
                  const hasVoted = submittedRoles.has(role.id);
                  const selectedCandidate = votes[role.id];

                  return (
                    <div
                      key={role.id}
                      className={`bg-white rounded-2xl shadow-xl p-6 ${
                        hasVoted ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">{role.name}</h3>
                        {hasVoted && (
                          <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            Voted
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {role.candidates.map((candidate) => {
                          const isSelected = selectedCandidate === candidate.id;

                          return (
                            <button
                              key={candidate.id}
                              onClick={() => handleVote(role.id, candidate.id)}
                              disabled={hasVoted}
                              className={`p-4 rounded-xl border-2 transition transform hover:scale-105 ${
                                isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300'
                              } ${hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                  {candidate.image_url ? (
                                    <img
                                      src={candidate.image_url}
                                      alt={candidate.name}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <User className="w-10 h-10 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                {candidate.logo_url && (
                                  <img
                                    src={candidate.logo_url}
                                    alt={`${candidate.name} logo`}
                                    className="w-10 h-10 object-cover rounded-full"
                                  />
                                )}
                                <div className="flex-1 text-left">
                                  <h4 className="text-lg font-semibold text-gray-800">
                                    {candidate.name}
                                  </h4>
                                  {isSelected && !hasVoted && (
                                    <p className="text-sm text-green-600 font-medium mt-1">
                                      Selected
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {!hasVoted && (
                        <button
                          onClick={() => submitVote(role.id)}
                          disabled={!selectedCandidate}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Vote for {role.name}
                        </button>
                      )}
                    </div>
                  );
                })}

                {allRolesVoted && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl shadow-xl p-12 text-center">
                    <div className="flex justify-center mb-6">
                      <div className="bg-green-600 p-4 rounded-full">
                        <CheckCircle className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">Voting Complete!</h3>  
                    <p className="text-gray-600 mb-8 text-lg">
                      Thank you for voting. Your votes have been recorded successfully.
                    </p>
                    <button
                      onClick={handleNextVoter}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                    >
                      Next Voter
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}