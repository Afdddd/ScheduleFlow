import { getAuthToken } from '../api/client';

/**
 * JWT 토큰 유틸리티
 * 
 * 주의: 프론트엔드에서 JWT 토큰의 payload만 디코딩합니다.
 * 서명 검증은 하지 않으므로, 실제 권한 체크는 백엔드에서 수행됩니다.
 * 프론트엔드에서는 UI 표시 목적으로만 사용합니다.
 */

export interface JwtPayload {
  role?: string;
  userId?: number;
  sub?: string; // username
  iat?: number; // issued at
  exp?: number; // expiration
}

/**
 * JWT 토큰의 payload 부분 디코딩
 * Base64 URL 디코딩만 수행 (서명 검증 없음)
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    // JWT는 header.payload.signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // payload 부분 디코딩
    const payload = parts[1];
    
    // Base64 URL 디코딩
    // Base64 URL은 + -> -, / -> _ 변환이 필요하고, padding(=) 제거
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent( //유니코드 처리
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
    
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
};

/**
 * 현재 사용자의 role 조회
 */
export const getCurrentUserRole = (): string | null => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  return payload?.role || null;
};

/**
 * 현재 사용자가 ADMIN인지 확인
 */
export const isAdmin = (): boolean => {
  return getCurrentUserRole() === 'ADMIN';
};

/**
 * 현재 사용자가 인증되었는지 확인
 */
export const isAuthenticated = (): boolean => {
    const token = getAuthToken();
    if (!token) {
        return false;
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) {
        // 토큰을 디코딩할 수 없거나 만료 시간이 없으면 유효하지 않은 것으로 간주합니다.
        return false;
    }

    // 만료 시간(초)을 현재 시간(밀리초)과 비교합니다.
    const isExpired = Date.now() >= payload.exp * 1000;

    return !isExpired;
};


