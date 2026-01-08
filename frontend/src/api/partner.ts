import apiClient from './client';
import { PageResponse, PartnerListResponse } from './list';

/**
 * 거래처 연락처 응답 타입
 */
export interface PartnerContactResponse {
  id: number;
  partnerId: number;
  name: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * 거래처 전체 목록 조회 (페이징 없이, 최대 1000개)
 * @returns 거래처 목록
 */
export const getAllPartners = async (): Promise<PartnerListResponse[]> => {
  // 페이징을 사용하되 큰 size로 전체 목록 가져오기
  const response = await apiClient.get<PageResponse<PartnerListResponse>>('/partners', {
    params: {
      page: 0,
      size: 1000,
    },
  });
  return response.data.content;
};

/**
 * 거래처 연락처 목록 조회
 * @param partnerId 거래처 ID
 * @returns 거래처 연락처 목록
 */
export const getPartnerContacts = async (
  partnerId: number
): Promise<PartnerContactResponse[]> => {
  const response = await apiClient.get<PartnerContactResponse[]>(
    `/partners/${partnerId}/contacts`
  );
  return response.data;
};

