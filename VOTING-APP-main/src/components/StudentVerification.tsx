import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

interface VerifiedStudent {
  id: string;
  student_id: string;
  name: string;
  class_id: string;
}

export default function StudentVerification() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Dummy student data for testing
  const DUMMY_STUDENTS: VerifiedStudent[] = [
    { id: '1', student_id: 'STU001', name: 'John Doe', class_id: 'CLASS001' },
    { id: '2', student_id: 'STU002', name: 'Jane Smith', class_id: 'CLASS001' },
    { id: '3', student_id: 'STU003', name: 'Mike Johnson', class_id: 'CLASS002' },
    { id: '4', student_id: 'STU004', name: 'Sarah Williams', class_id: 'CLASS002' },
    { id: '5', student_id: 'STU005', name: 'Alex Brown', class_id: 'CLASS001' },
  ];

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);   

    try {
      // Check dummy data (for testing)
      const dummyStudent = DUMMY_STUDENTS.find(
        (s) => s.student_id === studentId.toUpperCase() && s.class_id === classId.toUpperCase()
      );

      if (dummyStudent) {
        // Store verified student info for StudentVoting component
        sessionStorage.setItem('verifiedStudent', JSON.stringify(dummyStudent));
        navigate('/StudentVoting');
        return;
      }

      setError('Invalid Student ID or Class ID. Please try again.');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />
      {/* logo and back button removed; header handles navigation to home */}

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Student Verification</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your Student ID and Class ID to continue
            </p>
          </div>

          <form onSubmit={handleVerifyStudent} className="space-y-6">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., STU001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class ID
              </label>
              <input
                id="classId"
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g., CLASS001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>• STU001 / CLASS001</p>
            <p>• STU002 / CLASS001</p>
            <p>• STU003 / CLASS002</p>
          </div>
        </div>
      </div>
    </div>
  );
}
