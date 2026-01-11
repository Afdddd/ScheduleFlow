import apiClient from './client';

/**
 * 일정 생성 요청 타입
 */
export interface ScheduleCreateRequest {
  title: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  scheduleType?: string; // PROJECT, TEST_RUN, WIRING, DESIGN, MEETING
  projectId?: number | null;
  memberIds?: number[] | null;
}

/**
 * 일정 수정 요청 타입
 */
export interface ScheduleUpdateRequest {
  title?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  scheduleType?: string; // PROJECT, TEST_RUN, WIRING, DESIGN, MEETING
  projectId?: number | null;
  memberIds?: number[] | null;
}

/**
 * 일정 상세 응답 타입
 */
export interface ScheduleDetailResponse {
  id: number;
  title: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  type: 'PROJECT' | 'TEST_RUN' | 'WIRING' | 'DESIGN' | 'MEETING';
  projectId: number | null;
  members: Array<{
    id: number;
    name: string;
    position: string;
  }>;
}

/**
 * 일정 생성
 * @param request 일정 생성 요청
 * @returns 생성된 일정 ID
 */
export const createSchedule = async (request: ScheduleCreateRequest): Promise<number> => {
  const response = await apiClient.post<number>('/schedules', request);
  return response.data;
};

/**
 * 일정 상세 조회
 * @param scheduleId 일정 ID
 * @returns 일정 상세 정보
 */
export const getScheduleDetail = async (scheduleId: number): Promise<ScheduleDetailResponse> => {
  const response = await apiClient.get<ScheduleDetailResponse>(`/schedules/${scheduleId}`);
  return response.data;
};

/**
 * 일정 수정
 * @param scheduleId 일정 ID
 * @param request 일정 수정 요청
 * @returns 수정된 일정 상세 정보
 */
export const updateSchedule = async (
  scheduleId: number,
  request: ScheduleUpdateRequest
): Promise<ScheduleDetailResponse> => {
  const response = await apiClient.patch<ScheduleDetailResponse>(`/schedules/${scheduleId}`, request);
  return response.data;
};

/**
 * 일정 삭제
 * @param scheduleId 일정 ID
 */
export const deleteSchedule = async (scheduleId: number): Promise<void> => {
  await apiClient.delete(`/schedules/${scheduleId}`);
};

