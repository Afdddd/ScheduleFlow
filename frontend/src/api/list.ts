import apiClient from './client';

/**
 * 공통 페이징 응답 구조
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 프로젝트 목록 응답
 */
export interface ProjectListResponse {
  id: number;
  name: string;
  clientName: string;
  status: string;
  startDate: string;
  endDate: string;
  colorCode: string | null;
}

/**
 * 파일 목록 응답
 */
export interface FileListResponse {
  id: number;
  originalFileName: string;
  projectName: string | null;
  uploaderName: string;
  category: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

/**
 * 일정 목록 응답
 */
export interface ScheduleListResponse {
  id: number;
  title: string;
  projectName: string | null;
  type: string;
  startDate: string;
  endDate: string;
  memberNames: string[];
}

/**
 * 거래처 목록 응답
 */
export interface PartnerListResponse {
  id: number;
  companyName: string;
  mainPhone: string | null;
  address: string | null;
}

/**
 * 사원 목록 응답
 */
export interface UserListResponse {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string;
  position: string | null;
  role: string;
}

/**
 * 프로젝트 목록 조회
 */
export const getProjectList = async (
  query: string = '',
  page: number = 0,
  size: number = 5
): Promise<PageResponse<ProjectListResponse>> => {
  const response = await apiClient.get<PageResponse<ProjectListResponse>>('/projects', {
    params: {
      query: query || undefined,
      page,
      size,
    },
  });
  return response.data;
};

/**
 * 파일 목록 조회
 */
export const getFileList = async (
  query: string = '',
  page: number = 0,
  size: number = 5
): Promise<PageResponse<FileListResponse>> => {
  const response = await apiClient.get<PageResponse<FileListResponse>>('/files', {
    params: {
      query: query || undefined,
      page,
      size,
    },
  });
  return response.data;
};

/**
 * 일정 목록 조회
 */
export const getScheduleList = async (
  query: string = '',
  page: number = 0,
  size: number = 5
): Promise<PageResponse<ScheduleListResponse>> => {
  const response = await apiClient.get<PageResponse<ScheduleListResponse>>('/schedules', {
    params: {
      query: query || undefined,
      page,
      size,
    },
  });
  return response.data;
};

/**
 * 거래처 목록 조회
 */
export const getPartnerList = async (
  query: string = '',
  page: number = 0,
  size: number = 5
): Promise<PageResponse<PartnerListResponse>> => {
  const response = await apiClient.get<PageResponse<PartnerListResponse>>('/partners', {
    params: {
      query: query || undefined,
      page,
      size,
    },
  });
  return response.data;
};

/**
 * 사원 목록 조회 (ADMIN 전용)
 */
export const getUserList = async (
  query: string = '',
  page: number = 0,
  size: number = 5
): Promise<PageResponse<UserListResponse>> => {
  const response = await apiClient.get<PageResponse<UserListResponse>>('/admin/users', {
    params: {
      query: query || undefined,
      page,
      size,
    },
  });
  return response.data;
};

