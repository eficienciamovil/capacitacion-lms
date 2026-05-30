import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login          from './pages/Login';
import Layout         from './components/Layout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage      from './pages/admin/UsersPage';
import CoursesPage    from './pages/admin/CoursesPage';
import ReportsPage    from './pages/admin/ReportsPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseViewPage   from './pages/student/CourseViewPage';
import QuizPage         from './pages/student/QuizPage';
import ResultsPage      from './pages/student/ResultsPage';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><Layout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users"   element={<UsersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* Student routes */}
          <Route path="/dashboard" element={<PrivateRoute role="student"><Layout /></PrivateRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="course/:id"        element={<CourseViewPage />} />
            <Route path="course/:id/quiz"   element={<QuizPage />} />
            <Route path="course/:id/result" element={<ResultsPage />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
