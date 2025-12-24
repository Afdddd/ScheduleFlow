import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ErrorResponse } from './types';

/**
 * API 클라이언트 설정
 * 
 * 주요 기능:
 * 1. baseURL 자동 설정 (환경 변수 사용)
 * 2. JWT 토큰 자동 첨부 (요청 인터셉터)
 * 3. 에러 처리 (응답 인터셉터)
 * 4. 401 에러 시 로그인 페이지로 리다이렉트
 */

// JWT 토큰 저장 키 (localStorage)
const TOKEN_KEY = 'auth_token';

/**
 * JWT 토큰 저장
 * localStorage에 저장하여 페이지 새로고침 후에도 유지
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * JWT 토큰 조회
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * JWT 토큰 삭제 (로그아웃 시 사용)
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * axios 인스턴스 생성
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * 모든 요청에 JWT 토큰을 자동으로 첨부
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    
    // 토큰이 있으면 Authorization 헤더에 추가
    // 백엔드에서 "Bearer {token}" 형식을 기대함
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 에러 처리 및 401 에러 시 로그인 페이지로 리다이렉트
 */
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답은 그대로 반환
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    // 401 Unauthorized: 인증 실패
    if (error.response?.status === 401) {
      // 토큰 삭제
      removeAuthToken();
      
      // 로그인 페이지로 리다이렉트
      // TODO: React Router 설정 후 useNavigate로 변경 예정
      window.location.href = '/login';
    }
    
    // 에러 응답 반환 (컴포넌트에서 처리할 수 있도록)
    return Promise.reject(error);
  }
);

export default apiClient;

