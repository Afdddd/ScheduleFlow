import apiClient from './client';
import { PageResponse } from './list';
import { UserListResponse } from './list';

/**
 * 사원 전체 목록 조회 (페이징 없이, 최대 1000개)
 * @returns 사원 목록
 */
export const getAllUsers = async (): Promise<UserListResponse[]> => {
  // 페이징을 사용하되 큰 size로 전체 목록 가져오기
  const response = await apiClient.get<PageResponse<UserListResponse>>('/users', {
    params: {
      page: 0,
      size: 1000,
    },
  });
  return response.data.content;
};

/**
 * 사원 정보 수정 요청 (PATCH /users/{id}) — ADMIN 또는 본인
 */
export interface UserUpdateRequest {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
}

export const updateUser = async (userId: number, request: UserUpdateRequest): Promise<void> => {
  await apiClient.patch(`/users/${userId}`, request);
};

/**
 * 사원 삭제 (DELETE /users/{id}) — ADMIN 전용
 */
export const deleteUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

export type { UserListResponse };

