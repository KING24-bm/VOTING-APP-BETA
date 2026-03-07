import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

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

// custom hook to initialize and update the sitewide "sunset" background
function useSunsetBackground() {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const body = document.body;
    // base styles for the background image
    body.style.backgroundImage = "url('/images/euroschool-logo.png')";
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';

    function updateBackground() {
      // store offset in CSS variable; pseudo-element picks it up
      const offset = window.innerHeight * 0.25;
      body.style.setProperty('--bg-offset', `${offset}px`);
    }

    updateBackground();
    window.addEventListener('resize', updateBackground);
    return () => window.removeEventListener('resize', updateBackground);
  }, []);
}

function App() {
  useSunsetBackground();

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
