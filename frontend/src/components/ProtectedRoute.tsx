import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * 보호된 라우트 컴포넌트
 * 
 * 기능:
 * 1. 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 * 2. requireAdmin이 true인 경우 ADMIN 권한 체크
 * 3. 인증된 사용자는 Layout(Header + Sidebar)으로 감싸서 페이지 렌더링
 * 
 * 사용 예시:
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requireAdmin>
 *   <UserManagementPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // 인증 체크
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN 권한 체크
  if (requireAdmin && user?.role !== 'ADMIN') {
    // ADMIN 권한이 없으면 홈으로 리다이렉트
    // TODO: 권한 없음 메시지 표시하는 페이지로 변경 가능
    return <Navigate to="/" replace />;
  }

  // Layout으로 감싸서 반환 (Header + Sidebar 포함)
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;

