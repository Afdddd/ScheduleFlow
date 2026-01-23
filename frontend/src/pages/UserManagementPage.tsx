import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { getUserList, UserListResponse, PageResponse } from '../api/list';

/**
 * 사원 관리 페이지 (ADMIN 권한 필요)
 * 
 * 기능:
 * 1. 사원 목록 조회 (검색, 페이징)
 * 2. 사원 상세 보기/수정 (추후 구현)
 */
const UserManagementPage: React.FC = () => {
  const [data, setData] = useState<PageResponse<UserListResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 8;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getUserList(searchQuery, currentPage, pageSize);
        setData(result);
      } catch (error) {
        console.error('사원 목록 로딩 실패:', error);
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

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'STAFF':
        return '일반';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">사원 관리</h1>

      <SearchBar
        placeholder="사원 이름으로 검색"
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
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직책
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      사원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.content.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
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

export default UserManagementPage;
