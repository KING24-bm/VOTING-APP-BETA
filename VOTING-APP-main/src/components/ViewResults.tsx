import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BarChart3, PieChart } from 'lucide-react';
import Header from './Header';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

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
          const { data: candidates } = await supabase
            .from('candidates')
            .select('id, name, image_url')
            .eq('role_id', role.id);

          const candidatesWithVotes = await Promise.all(
            (candidates || []).map(async (candidate) => {
              const { count } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', candidate.id);

              return {
                ...candidate,
                vote_count: count || 0,
              };
            })
          );

          const { count: notaCount } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id)
            .is('candidate_id', null);

          if ((notaCount || 0) > 0) {
            candidatesWithVotes.push({
              id: 'nota',
              name: 'None of the Above',
              vote_count: notaCount || 0,
            } as any);
          }

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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden">

      {/* Rotating Background */}
      <div
        className="rotating-bg"
        style={{ backgroundImage: "url('/assets/ESNC LOGO BG.PNG')" }}
      />

      {/* Animation Style */}
      <style>
        {`
        .rotating-bg {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 650px;
          opacity: 0.08;
          animation: rotateBg 60s linear infinite;
          pointer-events: none;
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        `}
      </style>

      <Header />

      <div className="relative container mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Poll Results
          </h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading results...
              </p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No polls created yet.
              </p>
            </div>
          ) : (
            <>
              {/* Poll Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Poll
                </label>
                <select
                  value={selectedPollId}
                  onChange={(e) => setSelectedPollId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  {polls.map((poll) => (
                    <option key={poll.id} value={poll.id}>
                      {poll.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPoll && selectedPoll.roles.length > 0 && (
                <div className="space-y-8">

                  {/* Chart Switch */}
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                        chartType === 'bar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      Bar Chart
                    </button>

                    <button
                      onClick={() => setChartType('pie')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                        chartType === 'pie'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <PieChart className="w-5 h-5" />
                      Pie Chart
                    </button>
                  </div>

                  {selectedPoll.roles.map((role) => {
                    const chartData = role.candidates.map((candidate) => ({
                      name: candidate.name,
                      votes: candidate.vote_count,
                    }));

                    const COLORS = [
                      '#3b82f6',
                      '#ef4444',
                      '#10b981',
                      '#f59e0b',
                      '#8b5cf6',
                      '#ec4899',
                    ];

                    return (
                      <div key={role.id} className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6">
                        <h2 className="text-2xl font-bold mb-6">{role.name}</h2>

                        <div className="h-96 w-full">
                          <ResponsiveContainer width="100%" height="100%">

                            {chartType === 'bar' ? (
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="votes" fill="#2563eb" />
                              </BarChart>
                            ) : (
                              <RechartsPieChart>
                                <Pie
                                  data={chartData}
                                  dataKey="votes"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={120}
                                  label
                                >
                                  {chartData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            )}

                          </ResponsiveContainer>
                        </div>

                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                          Total votes: {role.candidates.reduce((s, c) => s + c.vote_count, 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}