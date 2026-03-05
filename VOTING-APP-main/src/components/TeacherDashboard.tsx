import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, BarChart3, Eye, LogOut } from 'lucide-react';
import CreatePoll from './CreatePoll';
import ViewPolls from './ViewPolls';
import ViewResults from './ViewResults';
import Header from './Header';

type View = 'menu' | 'create' | 'polls' | 'results';

export default function TeacherDashboard() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (currentView === 'create') {
    return <CreatePoll onBack={() => setCurrentView('menu')} />;
  }

  if (currentView === 'polls') {
    return <ViewPolls onBack={() => setCurrentView('menu')} />;
  }

  if (currentView === 'results') {
    return <ViewResults onBack={() => setCurrentView('menu')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <img src="/images/euroschool-logo.png" alt="EuroSchool North Campus" className="h-16 w-16 object-contain cursor-pointer mb-8" onClick={() => window.location.href = "/"} />
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Administrator Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage school polls and elections</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentView('create')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <PlusCircle className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Poll</h2>
            <p className="text-gray-600 text-center">
              Create a new poll with multiple roles and candidates
            </p>
          </button>

          <button
            onClick={() => setCurrentView('polls')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Eye className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">View Live Polls</h2>
            <p className="text-gray-600 text-center">
              See all active polls and manage them
            </p>
          </button>

          <button
            onClick={() => setCurrentView('results')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <BarChart3 className="w-12 h-12 text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">View Results</h2>
            <p className="text-gray-600 text-center">
              Check live vote counts and winners
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
