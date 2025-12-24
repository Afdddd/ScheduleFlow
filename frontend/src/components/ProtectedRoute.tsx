import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../utils/jwt';

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
  // 인증 체크
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN 권한 체크
  if (requireAdmin && !isAdmin()) {
    // ADMIN 권한이 없으면 홈으로 리다이렉트
    // TODO: 권한 없음 메시지 표시하는 페이지로 변경 가능
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

