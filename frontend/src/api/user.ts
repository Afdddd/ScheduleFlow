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

export type { UserListResponse };

