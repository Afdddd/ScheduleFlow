import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { useAuthStore } from '../stores/authStore';
import { getProjectList, ProjectListResponse, PageResponse } from '../api/list';

/**
 * 프로젝트 목록 페이지
 * 
 * 기능:
 * 1. 프로젝트 목록 조회 (검색, 페이징)
 * 2. 프로젝트 클릭 시 상세 페이지로 이동
 */
const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PageResponse<ProjectListResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 5;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getProjectList(searchQuery, currentPage, pageSize);
        setData(result);
      } catch (error) {
        console.error('프로젝트 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchQuery, currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // 검색 시 첫 페이지로 이동
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return '진행 중';
      case 'ON_HOLD':
        return '보류';
      case 'COMPLETE':
        return '완료';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">프로젝트 목록</h1>
        {isAdmin && (
          <button
            onClick={() => navigate('/projects/new')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            등록
          </button>
        )}
      </div>

      <SearchBar
        placeholder="프로젝트 이름으로 검색"
        onSearch={handleSearch}
      />

      {loading && (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      )}

      {!loading && data && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.content.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => handleRowClick(project.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {project.colorCode && (
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: project.colorCode }}
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {project.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.startDate} ~ {project.endDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <Pagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              pageSize={data.pageSize}
              totalElements={data.totalElements}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectListPage;
