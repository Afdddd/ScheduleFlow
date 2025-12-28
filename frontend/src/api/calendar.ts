import apiClient from './client';
import { format } from 'date-fns';

/**
 * 캘린더 관련 API 함수
 */

/**
 * 프로젝트 캘린더 응답 타입
 */
export interface ProjectCalendarResponse {
  id: number;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  colorCode: string | null;
  status: string | null; // ProjectStatus enum 값
}

/**
 * 일정 캘린더 응답 타입
 */
export interface ScheduleCalendarResponse {
  scheduleId: number;
  title: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  type: string | null; // ScheduleType enum 값
}

/**
 * 프로젝트 + 일정 캘린더 응답 타입
 */
export interface ProjectCalendarWithSchedulesResponse {
  project: ProjectCalendarResponse;
  schedules: ScheduleCalendarResponse[];
}

/**
 * 기간별 프로젝트 조회 (프로젝트만)
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 프로젝트 목록
 */
export const getProjectsByPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<ProjectCalendarResponse[]> => {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  const response = await apiClient.get<ProjectCalendarResponse[]>('/projects/period', {
    params: {
      startDate: startDateStr,
      endDate: endDateStr,
    },
  });
  
  return response.data;
};

/**
 * 기간별 프로젝트 + 일정 조회
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 프로젝트 + 일정 목록
 */
export const getProjectsByPeriodWithSchedules = async (
  startDate: Date,
  endDate: Date
): Promise<ProjectCalendarWithSchedulesResponse[]> => {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  const response = await apiClient.get<ProjectCalendarWithSchedulesResponse[]>(
    '/projects/period/with-schedules',
    {
      params: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
    }
  );
  
  return response.data;
};

/**
 * 기간별 기본 일정 조회 (프로젝트에 속하지 않은 일정)
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 기본 일정 목록
 */
export const getSchedulesByPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleCalendarResponse[]> => {
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  const response = await apiClient.get<ScheduleCalendarResponse[]>('/schedules/period', {
    params: {
      startDate: startDateStr,
      endDate: endDateStr,
    },
  });
  
  return response.data;
};

