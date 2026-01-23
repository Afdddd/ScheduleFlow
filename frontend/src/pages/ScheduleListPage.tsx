import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { useAuthStore } from '../stores/authStore';
import { getScheduleList, ScheduleListResponse, PageResponse } from '../api/list';

/**
 * 일정 목록 페이지
 * 
 * 기능:
 * 1. 일정 목록 조회 (검색, 페이징)
 * 2. 일정 상세 보기 (추후 구현)
 */
const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PageResponse<ScheduleListResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 8;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getScheduleList(searchQuery, currentPage, pageSize);
        setData(result);
      } catch (error) {
        console.error('일정 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchQuery, currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'PROJECT':
        return '프로젝트 일정';
      case 'TEST_RUN':
        return '시운전';
      case 'WIRING':
        return '전기 배선';
      case 'DESIGN':
        return '설계';
      case 'MEETING':
        return '미팅';
      default:
        return type;
    }
  };

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">일정 목록</h1>
        {isAdmin && (
          <button
            onClick={() => navigate('/schedules/new')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            등록
          </button>
        )}
      </div>

      <SearchBar
        placeholder="일정 제목으로 검색"
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
                    일정 제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">*/}
                  {/*  참여자*/}
                  {/*</th>*/}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.content.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/schedules/${schedule.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {schedule.title}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.projectName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTypeLabel(schedule.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.startDate} ~ {schedule.endDate}
                      </td>
                      {/*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">*/}
                      {/*  {schedule.memberNames.length > 0*/}
                      {/*    ? schedule.memberNames.join(', ')*/}
                      {/*    : '-'}*/}
                      {/*</td>*/}
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

export default ScheduleListPage;

