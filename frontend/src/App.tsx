import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
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
import MorePage from './pages/MorePage';
import MobilePhotosPage from './pages/MobilePhotosPage';
import UiPreviewPage from './pages/UiPreviewPage';
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
        {/* 공개 라우트 — 회원가입은 없다. 계정은 ADMIN이 사원관리에서 발급 */}
        <Route path="/login" element={<LoginPage />} />
        {/* 개발용 공통 컴포넌트 갤러리 (인증 없이 확인) */}
        <Route path="/ui-preview" element={<UiPreviewPage />} />

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

        {/* 모바일 '더보기' 탭 (거래처/파일/사원관리/설정 진입점) */}
        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <MorePage />
            </ProtectedRoute>
          }
        />

        {/* 모바일 사진·영상 올리기 흐름 (전체화면) */}
        <Route
          path="/photos"
          element={
            <ProtectedRoute bare>
              <MobilePhotosPage />
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
