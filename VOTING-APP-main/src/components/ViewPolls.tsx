import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Header from './Header';

interface Poll {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface ViewPollsProps {
  onBack: () => void;
}

export default function ViewPolls({ onBack }: ViewPollsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPolls(data || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePollStatus = async (pollId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: !currentStatus })
        .eq('id', pollId);

      if (error) throw error;

      setPolls(
        polls.map((p) =>
          p.id === pollId ? { ...p, is_active: !currentStatus } : p
        )
      );
    } catch (error) {
      console.error('Error toggling poll status:', error);
      alert('Failed to update poll status');
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('polls').delete().eq('id', pollId);

      if (error) throw error;

      setPolls(polls.filter((p) => p.id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />
      <div className="container mx-auto max-w-4xl">
        {/* logo removed; header still links to home */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Live Polls</h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No polls created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{poll.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            poll.is_active
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {poll.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {poll.description && (
                        <p className="text-gray-600 mb-2">{poll.description}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {new Date(poll.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePollStatus(poll.id, poll.is_active)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title={poll.is_active ? 'Deactivate poll' : 'Activate poll'}
                      >
                        {poll.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => deletePoll(poll.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition"
                        title="Delete poll"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
