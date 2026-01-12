import apiClient from './client';
import { PageResponse, ProjectListResponse } from './list';

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
 * 프로젝트 수정 요청 타입
 */
export interface ProjectUpdateRequest {
  name?: string;
  clientId?: number;
  partnerContactIds?: number[];
  memberIds?: number[];
  status?: string; // IN_PROGRESS, ON_HOLD, COMPLETE
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  description?: string | null;
  colorCode?: string | null;
}

/**
 * 프로젝트 상세 응답 타입
 */
export interface ProjectDetailResponse {
  id: number;
  name: string;
  status: 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETE';
  description: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  colorCode: string | null;
  client: {
    id: number;
    companyName: string;
  };
  partnerContacts: Array<{
    partnerContactId: number;
    name: string;
    companyName: string;
    position: string | null;
    phone: string | null;
    email: string | null;
  }>;
  members: Array<{
    id: number;
    name: string;
    position: string;
  }>;
  schedules: Array<{
    scheduleId: number;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    memberNames: string[];
  }>;
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

/**
 * 프로젝트 상세 조회
 * @param projectId 프로젝트 ID
 * @returns 프로젝트 상세 정보
 */
export const getProjectDetail = async (projectId: number): Promise<ProjectDetailResponse> => {
  const response = await apiClient.get<ProjectDetailResponse>(`/projects/${projectId}`);
  return response.data;
};

/**
 * 프로젝트 수정
 * @param projectId 프로젝트 ID
 * @param request 프로젝트 수정 요청
 * @returns 수정된 프로젝트 상세 정보
 */
export const updateProject = async (
  projectId: number,
  request: ProjectUpdateRequest
): Promise<ProjectDetailResponse> => {
  const response = await apiClient.patch<ProjectDetailResponse>(`/projects/${projectId}`, request);
  return response.data;
};

/**
 * 프로젝트 삭제
 * @param projectId 프로젝트 ID
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  await apiClient.delete(`/projects/${projectId}`);
};

/**
 * 프로젝트 전체 목록 조회 (페이징 없이, 최대 1000개)
 * @returns 프로젝트 목록
 */
export const getAllProjects = async (): Promise<ProjectListResponse[]> => {
  const response = await apiClient.get<PageResponse<ProjectListResponse>>('/projects', {
    params: {
      page: 0,
      size: 1000,
    },
  });
  return response.data.content;
};

