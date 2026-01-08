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

