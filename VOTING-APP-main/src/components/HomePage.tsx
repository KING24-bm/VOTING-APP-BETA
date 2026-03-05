import { UserCog, Users } from 'lucide-react';

interface HomePageProps {
  onSelectTeacher: () => void;
  onSelectStudent: () => void;
}

export default function HomePage({ onSelectTeacher, onSelectStudent }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
      <div className="mb-12">
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            School Voting System
          </h1>
          <p className="text-xl text-gray-600">
            A simple and secure way to conduct school elections
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <button
            onClick={onSelectTeacher}
            className="bg-white rounded-2xl shadow-xl p-12 hover:shadow-2xl transition transform hover:-translate-y-2"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-6 rounded-full">
                <UserCog className="w-16 h-16 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Administrator Portal
            </h2>
            <p className="text-gray-600 text-center text-lg">
              Create and manage polls, view results, and control elections
            </p>
          </button>

          <button
            onClick={onSelectStudent}
            className="bg-white rounded-2xl shadow-xl p-12 hover:shadow-2xl transition transform hover:-translate-y-2"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-6 rounded-full">
                <Users className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Voting Page
            </h2>
            <p className="text-gray-600 text-center text-lg">
              Cast your vote for your favorite candidates
            </p>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
