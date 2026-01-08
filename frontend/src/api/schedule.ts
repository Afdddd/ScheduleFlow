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
 * 일정 생성
 * @param request 일정 생성 요청
 * @returns 생성된 일정 ID
 */
export const createSchedule = async (request: ScheduleCreateRequest): Promise<number> => {
  const response = await apiClient.post<number>('/schedules', request);
  return response.data;
};

