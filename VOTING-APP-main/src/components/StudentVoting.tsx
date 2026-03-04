import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Vote, CheckCircle, User, LogOut } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  image_url: string;
  logo_url: string;
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

interface VerifiedStudent {
  id: string;
  student_id: string;
  name: string;
  class_id: string;
}

export default function StudentVoting() {
  // Verification states
  const [isVerified, setIsVerified] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);

  // Dummy student data for testing
  const DUMMY_STUDENTS: VerifiedStudent[] = [
    { id: '1', student_id: 'STU001', name: 'John Doe', class_id: 'CLASS001' },
    { id: '2', student_id: 'STU002', name: 'Jane Smith', class_id: 'CLASS001' },
    { id: '3', student_id: 'STU003', name: 'Mike Johnson', class_id: 'CLASS002' },
    { id: '4', student_id: 'STU004', name: 'Sarah Williams', class_id: 'CLASS002' },
    { id: '5', student_id: 'STU005', name: 'Alex Brown', class_id: 'CLASS001' },
  ];

  // Voting states
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [voterId, setVoterId] = useState<string>('');
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submittedRoles, setSubmittedRoles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVerified) {
      initializeVoting();
    }
  }, [isVerified]);

  useEffect(() => {
    if (selectedPollId && voterId) {
      checkExistingVotes(selectedPollId);
    }
  }, [selectedPollId, voterId]);

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);
    setVerificationError('');

    try {
      // First check dummy data (for testing)
      const dummyStudent = DUMMY_STUDENTS.find(
        (s) => s.student_id === studentId.toUpperCase() && s.class_id === classId.toUpperCase()
      );

      if (dummyStudent) {
        setVerifiedStudent(dummyStudent);
        setIsVerified(true);
        setVerificationLoading(false);
        return;
      }

      // Query Supabase for student verification
      const { data, error: supabaseError } = await supabase
        .from('students')
        .select('id, student_id, name, class_id')
        .eq('student_id', studentId.toUpperCase())
        .eq('class_id', classId.toUpperCase())
        .single();

      if (supabaseError || !data) {
        setVerificationError('Invalid Student ID or Class ID. Please try again.');
        setVerificationLoading(false);
        return;
      }

      setVerifiedStudent(data as VerifiedStudent);
      setIsVerified(true);
    } catch (err) {
      setVerificationError('An error occurred during verification. Please try again.');
      console.error(err);
    }

    setVerificationLoading(false);
  };

  const initializeVoting = () => {
    const storedVoterId = localStorage.getItem(`voterId_${verifiedStudent?.id}`);
    if (!storedVoterId) {
      const newVoterId = `voter_${verifiedStudent?.id}_${Date.now()}`;
      localStorage.setItem(`voterId_${verifiedStudent?.id}`, newVoterId);
      setVoterId(newVoterId);
    } else {
      setVoterId(storedVoterId);
    }

    fetchPolls();
  };

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
                  .select('id, name, image_url, logo_url')
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
        student_id: verifiedStudent?.student_id,
        class_id: verifiedStudent?.class_id,
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

  const handleLogout = () => {
    setIsVerified(false);
    setStudentId('');
    setClassId('');
    setVerifiedStudent(null);
    setVotes({});
    setSubmittedRoles(new Set());
    setError('');
    setVerificationError('');
    setPolls([]);
    setSelectedPollId('');
    setIsLoading(true);
  };

  const handleNextVoter = () => {
    handleLogout();
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Student Verification
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your credentials to access voting
          </p>

          <form onSubmit={handleVerifyStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., STU001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Test IDs: STU001, STU002, STU003, STU004, STU005</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class ID
              </label>
              <input
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g., CLASS001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Test Class IDs: CLASS001, CLASS002</p>
            </div>

            {verificationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {verificationError}
              </div>
            )}

            <button
              type="submit"
              disabled={verificationLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              {verificationLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const selectedPoll = polls.find((p) => p.id === selectedPollId);
  const allRolesVoted =
    selectedPoll &&
    selectedPoll.roles.length > 0 &&
    submittedRoles.size === selectedPoll.roles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <img src="/images/euroschool-logo.png" alt="EuroSchool North Campus" className="h-16 w-16 object-contain cursor-pointer" onClick={() => window.location.href = "/"} />
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
            {verifiedStudent?.name}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

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
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <h4 className="text-lg font-semibold text-gray-800">
                                    {candidate.name}
                                  </h4>
                                  {isSelected && !hasVoted && (
                                    <p className="text-sm text-green-600 font-medium mt-1">
                                      Selected
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {candidate.logo_url && (
                                    <img
                                      src={candidate.logo_url}
                                      alt={`${candidate.name} logo`}
                                      className="w-16 h-16 object-cover rounded-full"
                                    />
                                  )}
                                  <div className="flex-shrink-0">
                                    {candidate.image_url ? (
                                      <img
                                        src={candidate.image_url}
                                        alt={candidate.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <User className="w-10 h-10 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
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