import apiClient from './client';

/**
 * 파일 업로드 요청
 * @param projectId 프로젝트 ID
 * @param file 업로드할 파일
 * @param category 파일 카테고리
 * @returns 업로드된 파일 정보
 */
export interface FileUploadResponse {
  id: number;
  projectId: number;
  userId: number;
  category: string;
  storedFileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
}

/**
 * 파일 조회 응답 타입
 */
export interface FileResponse {
  id: number | null;
  projectId: number | null;
  userId: number | null;
  category: string | null;
  storedFileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
}

/**
 * 파일 업로드
 * @param projectId 프로젝트 ID
 * @param file 업로드할 파일
 * @param category 파일 카테고리
 * @returns 업로드된 파일 정보
 */
export const uploadFile = async (
  projectId: number,
  file: File,
  category: string
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await apiClient.post<FileUploadResponse>(
    `/files/${projectId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * 프로젝트별 파일 목록 조회
 * @param projectId 프로젝트 ID
 * @returns 파일 목록
 */
export const getProjectFiles = async (projectId: number): Promise<FileResponse[]> => {
  const response = await apiClient.get<FileResponse[]>(`/files/${projectId}`);
  return response.data;
};

/**
 * 파일 다운로드
 * @param fileId 파일 ID
 * @returns Blob 데이터
 */
export const downloadFile = async (fileId: number): Promise<Blob> => {
  const response = await apiClient.get(`/files/download/${fileId}`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * 파일 삭제
 * @param fileId 파일 ID
 */
export const deleteFile = async (fileId: number): Promise<void> => {
  await apiClient.delete(`/files/delete/${fileId}`);
};

