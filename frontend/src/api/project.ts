import apiClient from './client';

/**
 * 프로젝트 생성 요청 타입
 */
export interface ProjectCreateRequest {
  name: string;
  clientId: number;
  partnerContactIds: number[];
  memberIds: number[];
  status?: string; // IN_PROGRESS, ON_HOLD, COMPLETE
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  description?: string | null;
  colorCode?: string | null;
}

/**
 * 프로젝트 생성
 * @param request 프로젝트 생성 요청
 * @returns 생성된 프로젝트 ID
 */
export const createProject = async (request: ProjectCreateRequest): Promise<number> => {
  const response = await apiClient.post<number>('/projects', request);
  return response.data;
};

