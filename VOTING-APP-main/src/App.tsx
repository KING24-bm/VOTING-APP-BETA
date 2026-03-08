import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import RotatingBackground from './components/RotatingBackground';

// Lazy load pages
const HomePage = lazy(() => import('./components/HomePage'));
const TeacherLanding = lazy(() => import('./components/TeacherLanding'));
const TeacherLogin = lazy(() => import('./components/TeacherLogin'));
const TeacherSignup = lazy(() => import('./components/TeacherSignup'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const StudentVerification = lazy(() => import('./components/StudentVerification'));
const StudentVoting = lazy(() => import('./components/StudentVoting'));

// Loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route for Teacher Dashboard
function ProtectedTeacherRoute() {
  const { teacherId, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!teacherId) {
    return <Navigate to="/TeacherLanding" replace />;
  }

  return <TeacherDashboard />;
}

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<HomePage />} />

        {/* Teacher routes */}
        <Route path="/TeacherLanding" element={<TeacherLanding />} />
        <Route path="/TeacherLogin" element={<TeacherLogin />} />
        <Route path="/TeacherSignup" element={<TeacherSignup />} />
        <Route path="/TeacherDashboard" element={<ProtectedTeacherRoute />} />

        {/* Student routes */}
        <Route path="/StudentVerification" element={<StudentVerification />} />
        <Route path="/StudentVoting" element={<StudentVoting />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>

          {/* Global rotating ESNC background */}
          <RotatingBackground />

          <AppContent />

        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;