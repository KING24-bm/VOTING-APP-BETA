import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import StudentVoting from './components/StudentVoting';

type View = 'home' | 'teacher-login' | 'teacher-dashboard' | 'student-voting';

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

  if (view === 'teacher-login') {
    return <TeacherLogin />;
  }

  if (view === 'student-voting') {
    return <StudentVoting />;
  }

  return (
    <HomePage
      onSelectTeacher={() => setView('teacher-login')}
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
