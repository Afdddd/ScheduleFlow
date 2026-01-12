import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import FileListPage from './pages/FileListPage';
import ScheduleListPage from './pages/ScheduleListPage';
import ScheduleCreatePage from './pages/ScheduleCreatePage';
import ScheduleDetailPage from './pages/ScheduleDetailPage';
import PartnerListPage from './pages/PartnerListPage';
import PartnerCreatePage from './pages/PartnerCreatePage';
import PartnerDetailPage from './pages/PartnerDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // 앱 시작 시 인증 상태 초기화 (localStorage에서 토큰 복원)
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* 보호된 라우트 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute requireAdmin>
              <ProjectCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FileListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <ProtectedRoute>
              <ScheduleListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/new"
          element={
            <ProtectedRoute requireAdmin>
              <ScheduleCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/:id"
          element={
            <ProtectedRoute>
              <ScheduleDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners"
          element={
            <ProtectedRoute>
              <PartnerListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners/new"
          element={
            <ProtectedRoute requireAdmin>
              <PartnerCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners/:id"
          element={
            <ProtectedRoute>
              <PartnerDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN 권한 필요한 라우트 */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* 404 페이지 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
