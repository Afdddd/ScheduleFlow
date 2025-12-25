import apiClient from './client';
import { useAuthStore } from '../stores/authStore';

/**
 * 인증 관련 API 함수
 */

export interface SignInRequest {
  username: string;
  password: string;
}

/**
 * 로그인
 * @param request 로그인 요청 (username, password)
 * @returns JWT 토큰
 */
export const signIn = async (request: SignInRequest): Promise<string> => {
  const response = await apiClient.post<string>('/auth/sign-in', request);
  const token = response.data;
  
  // authStore를 통해 토큰 저장 및 상태 업데이트
  // 주의: 이 함수는 컴포넌트 외부에서 호출될 수 있으므로
  // 직접 스토어를 업데이트해야 함
  useAuthStore.getState().login(token);
  
  return token;
};

