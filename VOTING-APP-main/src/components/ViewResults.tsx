import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trophy, Users, BarChart3, PieChart } from 'lucide-react';
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
  Legend,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />
      <div className="container mx-auto max-w-6xl">
        <img src="/images/euroschool-logo.png" alt="EuroSchool North Campus" className="h-16 w-16 object-contain mb-8" onClick={() => window.location.href = "/"}/>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
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
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                        chartType === 'bar'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      Bar Chart
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                        chartType === 'pie'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <PieChart className="w-5 h-5" />
                      Pie Chart
                    </button>
                  </div>

                  {chartType === 'bar' && (
                    <div className="space-y-8">
                      {selectedPoll.roles.map((role) => {
                        const chartData = role.candidates.map((candidate) => ({
                          name: candidate.name,
                          votes: candidate.vote_count,
                        }));

                        return (
                          <div key={role.id} className="border-2 border-gray-200 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{role.name}</h2>
                            <div className="h-96 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="votes" fill="#2563eb" radius={[8, 8, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                Total votes: {role.candidates.reduce((sum, c) => sum + c.vote_count, 0)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {chartType === 'pie' && (
                    <div className="space-y-8">
                      {selectedPoll.roles.map((role) => {
                        const COLORS = [
                          '#3b82f6',
                          '#ef4444',
                          '#10b981',
                          '#f59e0b',
                          '#8b5cf6',
                          '#ec4899',
                          '#14b8a6',
                          '#f97316',
                        ];

                        const chartData = role.candidates.map((candidate) => ({
                          name: candidate.name,
                          value: candidate.vote_count,
                        }));

                        return (
                          <div key={role.id} className="border-2 border-gray-200 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{role.name}</h2>
                            <div className="h-96 w-full flex justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                Total votes: {role.candidates.reduce((sum, c) => sum + c.vote_count, 0)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
