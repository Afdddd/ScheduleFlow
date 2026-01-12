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

/**
 * 거래처 생성 요청 타입
 */
export interface PartnerCreateRequest {
  companyName: string; // 필수
  mainPhone?: string | null;
  address?: string | null;
  description?: string | null;
}

/**
 * 거래처 응답 타입
 */
export interface PartnerResponse {
  id: number;
  companyName: string;
  mainPhone: string | null;
  address: string | null;
  description: string | null;
}

/**
 * 거래처 직원 생성 요청 타입
 */
export interface PartnerContactCreateRequest {
  name: string; // 필수
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * 거래처 생성
 * @param request 거래처 생성 요청
 * @returns 생성된 거래처 정보
 */
export const createPartner = async (request: PartnerCreateRequest): Promise<PartnerResponse> => {
  const response = await apiClient.post<PartnerResponse>('/partners', {
    id: null,
    ...request,
  });
  return response.data;
};

/**
 * 거래처 직원 생성
 * @param partnerId 거래처 ID
 * @param request 거래처 직원 생성 요청
 * @returns 생성된 거래처 직원 정보
 */
export const createPartnerContact = async (
  partnerId: number,
  request: PartnerContactCreateRequest
): Promise<PartnerContactResponse> => {
  const response = await apiClient.post<PartnerContactResponse>(
    `/partners/${partnerId}/contacts`,
    {
      id: null,
      partnerId,
      ...request,
    }
  );
  return response.data;
};

/**
 * 거래처 수정 요청 타입
 */
export interface PartnerUpdateRequest {
  id: number;
  companyName?: string | null;
  mainPhone?: string | null;
  address?: string | null;
  description?: string | null;
}

/**
 * 거래처 직원 수정 요청 타입
 */
export interface PartnerContactUpdateRequest {
  id: number;
  name?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * 거래처 상세 조회
 * @param partnerId 거래처 ID
 * @returns 거래처 상세 정보
 */
export const getPartnerDetail = async (partnerId: number): Promise<PartnerResponse> => {
  const response = await apiClient.get<PartnerResponse>(`/partners/${partnerId}`);
  return response.data;
};

/**
 * 거래처 수정
 * @param request 거래처 수정 요청
 * @returns 수정된 거래처 정보
 */
export const updatePartner = async (request: PartnerUpdateRequest): Promise<PartnerResponse> => {
  const response = await apiClient.put<PartnerResponse>('/partners', request);
  return response.data;
};

/**
 * 거래처 삭제
 * @param partnerId 거래처 ID
 */
export const deletePartner = async (partnerId: number): Promise<void> => {
  await apiClient.delete(`/partners/${partnerId}`);
};

/**
 * 거래처 직원 수정
 * @param partnerId 거래처 ID
 * @param request 거래처 직원 수정 요청
 * @returns 수정된 거래처 직원 정보
 */
export const updatePartnerContact = async (
  partnerId: number,
  request: PartnerContactUpdateRequest
): Promise<PartnerContactResponse> => {
  const response = await apiClient.put<PartnerContactResponse>(
    `/partners/${partnerId}/contacts`,
    request
  );
  return response.data;
};

/**
 * 거래처 직원 삭제
 * @param partnerId 거래처 ID
 * @param contactId 거래처 직원 ID
 */
export const deletePartnerContact = async (
  partnerId: number,
  contactId: number
): Promise<void> => {
  await apiClient.delete(`/partners/${partnerId}/contacts/${contactId}`);
};

