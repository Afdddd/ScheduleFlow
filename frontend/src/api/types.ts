/**
 * API 응답 타입 정의
 * 백엔드의 ErrorResponse와 일치하도록 작성
 */

// 에러 응답 타입 (백엔드 ErrorResponse와 일치)
export interface ErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  path: string;
}

// API 응답 래퍼 타입 (성공/실패 공통)
export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
}

