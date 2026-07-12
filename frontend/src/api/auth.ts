import apiClient, { setRefreshToken } from './client';
import { useAuthStore } from '../stores/authStore';

/**
 * 인증 관련 API 함수
 */

export interface SignInRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone: string;
}

/**
 * 로그인
 * @param request 로그인 요청 (username, password)
 * @returns 액세스·리프레시 토큰 쌍
 */
export const signIn = async (request: SignInRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/sign-in', request);
  const { accessToken, refreshToken } = response.data;

  // 리프레시 토큰은 localStorage에 보관 — 액세스 토큰 만료 시 자동 재발급(자동 로그인)에 쓰인다
  setRefreshToken(refreshToken);

  // authStore를 통해 토큰 저장 및 상태 업데이트
  // 주의: 이 함수는 컴포넌트 외부에서 호출될 수 있으므로
  // 직접 스토어를 업데이트해야 함
  useAuthStore.getState().login(accessToken);

  return response.data;
};

/**
 * 사원 등록 (ADMIN 전용 — 백엔드 /auth/sign-up이 hasRole('ADMIN')로 보호됨)
 * @param request 등록 요청 (username, password, name, email, phone)
 * @returns 생성된 사용자 ID
 */
export const signUp = async (request: SignUpRequest): Promise<number> => {
  const response = await apiClient.post<number>('/auth/sign-up', request);
  return response.data;
};

