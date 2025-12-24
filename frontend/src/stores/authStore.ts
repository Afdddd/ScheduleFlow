import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwtPayload, JwtPayload } from '../utils/jwt';
import { getAuthToken, setAuthToken, removeAuthToken } from '../api/client';

/**
 * 사용자 정보 인터페이스
 */
export interface User {
  id: number;
  username: string;
  role: string;
}

/**
 * 인증 상태 스토어
 * 
 * Zustand를 사용한 전역 인증 상태 관리
 * persist 미들웨어로 localStorage와 동기화하여
 * 페이지 새로고침 시에도 상태 유지
 */
interface AuthState {
  // 상태
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;

  // 액션
  login: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
const extractUserFromToken = (token: string): User | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.userId || !payload.sub || !payload.role) {
    return null;
  }

  return {
    id: payload.userId,
    username: payload.sub,
    role: payload.role,
  };
};

/**
 * 인증 스토어 생성
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기 상태
      isAuthenticated: false,
      user: null,
      token: null,

      // 로그인
      login: (token: string) => {
        // 토큰 저장
        setAuthToken(token);
        
        // 사용자 정보 추출
        const user = extractUserFromToken(token);
        
        // 상태 업데이트
        set({
          isAuthenticated: true,
          user,
          token,
        });
      },

      // 로그아웃
      logout: () => {
        // 토큰 삭제
        removeAuthToken();
        
        // 상태 초기화
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },

      // 초기화 (페이지 로드 시 토큰 복원)
      initialize: () => {
        const token = getAuthToken();
        if (token) {
          const user = extractUserFromToken(token);
          set({
            isAuthenticated: true,
            user,
            token,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage 키
      // persist 미들웨어 설정
      // token은 localStorage에 직접 저장하지 않고 (api/client.ts에서 관리)
      // isAuthenticated와 user만 persist
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // token은 제외 (api/client.ts에서 관리)
      }),
    }
  )
);

