import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Vote, CheckCircle, User, LogOut } from 'lucide-react';
import Header from './Header';

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
  const navigate = useNavigate();

  const [isVerified, setIsVerified] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [voterId, setVoterId] = useState<string>('');
  const [votes, setVotes] = useState<Record<string, string | null>>({});
  const [submittedRoles, setSubmittedRoles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

  useEffect(() => {
    const storedStudent = sessionStorage.getItem('verifiedStudent');
    if (storedStudent) {
      const parsedStudent = JSON.parse(storedStudent);
      setVerifiedStudent(parsedStudent);
      setIsVerified(true);
    } else {
      navigate('/StudentVerification');
    }
  }, []);

  useEffect(() => {
    if (isVerified) {
      fetchPolls();
    }
  }, [isVerified]);

  const fetchPolls = async () => {
    try {
      const { data: pollsData } = await supabase
        .from('polls')
        .select('id, title, description')
        .eq('is_active', true);

      if (!pollsData) return;

      const pollsWithRoles = await Promise.all(
        pollsData.map(async (poll) => {
          const { data: roles } = await supabase
            .from('roles')
            .select('id, name')
            .eq('poll_id', poll.id);

          const rolesWithCandidates = await Promise.all(
            (roles || []).map(async (role) => {
              const { data: candidates } = await supabase
                .from('candidates')
                .select('id, name, image_url, logo_url')
                .eq('role_id', role.id);

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
      if (pollsWithRoles.length > 0) {
        setSelectedPollId(pollsWithRoles[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = (roleId: string, candidateId: string | null) => {
    if (submittedRoles.has(roleId)) return;
    setVotes({ ...votes, [roleId]: candidateId });
  };

  const submitVote = async (roleId: string) => {
    const candidateId = votes[roleId];
    if (candidateId === undefined) {
      setError('Please select a candidate');
      return;
    }

    try {
      await supabase.from('votes').insert({
        role_id: roleId,
        candidate_id: candidateId,
        voter_id: voterId,
      });

      setSubmittedRoles(new Set([...submittedRoles, roleId]));
      setError('');

      const poll = polls.find((p) => p.id === selectedPollId);
      if (poll) {
        const index = poll.roles.findIndex((r) => r.id === roleId);
        if (index < poll.roles.length - 1) {
          setCurrentRoleIndex(index + 1);
        }
      }
    } catch {
      setError('Vote submission failed.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('verifiedStudent');
    navigate('/StudentVerification');
  };

  const selectedPoll = polls.find((p) => p.id === selectedPollId);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">

      {/* Rotating Background Logo */}
      <div
        className="rotating-bg"
        style={{ backgroundImage: "url('/assets/ESNC LOGO BG.PNG')" }}
      ></div>

      <Header />

      <div className="container mx-auto max-w-4xl">

        <div className="flex justify-between items-center mb-8">
          <div className="bg-green-100 dark:bg-gray-700 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-sm font-medium">
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

          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Student Voting
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            Cast your vote for each role
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">Loading polls...</div>
        ) : selectedPoll ? (
          <div className="space-y-6">

            {selectedPoll.roles.map((role, index) => {
              if (index !== currentRoleIndex) return null;

              const selectedCandidate = votes[role.id];
              const hasVoted = submittedRoles.has(role.id);

              return (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                >

                  <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    {role.name}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">

                    {role.candidates.map((candidate) => {

                      const isSelected = selectedCandidate === candidate.id;

                      return (
                        <button
                          key={candidate.id}
                          onClick={() => handleVote(role.id, candidate.id)}
                          disabled={hasVoted}
                          className={`p-4 border-2 rounded-xl transition ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >

                          <div className="flex justify-between items-center">

                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                {candidate.name}
                              </h4>
                            </div>

                            {candidate.image_url ? (
                              <img
                                src={candidate.image_url}
                                alt={candidate.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <User className="w-12 h-12 text-gray-400" />
                            )}

                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {!hasVoted && (
                    <button
                      onClick={() => submitVote(role.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                    >
                      Submit Vote
                    </button>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="text-red-600 text-center">{error}</div>
            )}

          </div>
        ) : (
          <div>No polls available</div>
        )}
      </div>

      {/* Rotating Background Animation */}
      <style>
        {`
        .rotating-bg {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 650px;
          opacity: 0.05;
          animation: rotateBg 60s linear infinite;
          pointer-events: none;
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        `}
      </style>

    </div>
  );
}