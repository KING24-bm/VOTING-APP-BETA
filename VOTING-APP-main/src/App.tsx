import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import TeacherLanding from './components/TeacherLanding';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import StudentVoting from './components/StudentVoting';

type View = 'home' | 'teacher-landing' | 'teacher-login' | 'teacher-signup' | 'teacher-dashboard' | 'student-voting';

function AppContent() {
  const [view, setView] = useState<View>('home');
  const { teacherId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (teacherId && (view === 'teacher-login' || view === 'teacher-dashboard')) {
    return <TeacherDashboard />;
  }

  if (view === 'teacher-landing') {
    return (
      <TeacherLanding
        onLogin={() => setView('teacher-login')}
        onSignup={() => setView('teacher-signup')}
      />
    );
  }

  if (view === 'teacher-login') {
    return <TeacherLogin />;
  }

  if (view === 'teacher-signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign Up</h1>
          <p className="text-gray-600 mb-6">
            Please contact your school administrator to create a new account.
          </p>
          <button
            onClick={() => setView('teacher-landing')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (view === 'student-voting') {
    return <StudentVoting />;
  }

  return (
    <HomePage
      onSelectTeacher={() => setView('teacher-landing')}
      onSelectStudent={() => setView('student-voting')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
