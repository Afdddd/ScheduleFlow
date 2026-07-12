import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ErrorResponse } from './types';

/**
 * API 클라이언트 설정
 *
 * 주요 기능:
 * 1. baseURL 자동 설정 (환경 변수 사용)
 * 2. JWT 토큰 자동 첨부 (요청 인터셉터)
 * 3. 에러 처리 (응답 인터셉터)
 * 4. 401 에러 시 리프레시 토큰으로 자동 재발급 후 원요청 재시도 (자동 로그인)
 * 5. 재발급 실패 시 로그인 페이지로 리다이렉트
 */

// JWT 토큰 저장 키 (localStorage)
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

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

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * axios 인스턴스 생성
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
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

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 동시에 여러 요청이 401을 맞아도 재발급은 한 번만 하도록 진행 중인 Promise를 공유
let refreshPromise: Promise<string> | null = null;

/**
 * 리프레시 토큰으로 새 토큰 쌍을 발급받는다.
 * apiClient가 아닌 기본 axios를 쓰는 이유: 인터셉터를 다시 타면
 * 만료된 액세스 토큰이 첨부되고, 401 시 무한 재귀에 빠질 수 있다.
 */
const requestNewTokens = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('리프레시 토큰 없음');
  }
  const response = await axios.post<TokenResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
  setAuthToken(response.data.accessToken);
  setRefreshToken(response.data.refreshToken);
  return response.data.accessToken;
};

/**
 * 재발급까지 실패했을 때 — 모든 인증 흔적을 지우고 로그인으로 보낸다.
 * zustand persist(auth-storage)도 함께 지워야 재로드 시 stale isAuthenticated가 남지 않는다.
 * (authStore를 import하면 순환 참조가 되므로 localStorage를 직접 정리)
 */
const forceLogout = (): void => {
  removeAuthToken();
  removeRefreshToken();
  localStorage.removeItem('auth-storage');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * 응답 인터셉터
 * 401 → 리프레시 토큰으로 재발급 후 원요청 1회 재시도, 실패 시 로그인 리다이렉트
 */
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답은 그대로 반환
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && config) {
      const requestUrl = config.url || '';

      // 로그인 자체의 401(잘못된 아이디/비밀번호)은 폼에서 처리하도록 그대로 반환
      if (requestUrl.includes('/auth/sign-in')) {
        return Promise.reject(error);
      }

      // 아직 재시도 전이면 리프레시 토큰으로 재발급 시도
      if (!config._retry) {
        config._retry = true;
        try {
          refreshPromise = refreshPromise ?? requestNewTokens().finally(() => {
            refreshPromise = null;
          });
          const newToken = await refreshPromise;
          config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(config);
        } catch {
          forceLogout();
        }
      } else {
        // 재발급 받은 토큰으로도 401 — 세션을 살릴 수 없다
        forceLogout();
      }
    }

    // 에러 응답 반환 (컴포넌트에서 처리할 수 있도록)
    return Promise.reject(error);
  }
);

export default apiClient;
