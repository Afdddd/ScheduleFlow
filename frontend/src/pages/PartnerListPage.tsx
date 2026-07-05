import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { useAuthStore } from '../stores/authStore';
import { getPartnerList, PartnerListResponse, PageResponse } from '../api/list';
import MobilePartnerList from './MobilePartnerList';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * 거래처 목록 페이지
 * 
 * 기능:
 * 1. 거래처 목록 조회 (검색, 페이징)
 * 2. 거래처 상세 보기 (추후 구현)
 */
const PartnerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PageResponse<PartnerListResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 8;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getPartnerList(searchQuery, currentPage, pageSize);
        setData(result);
      } catch (error) {
        console.error('거래처 목록 로딩 실패:', error);
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

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePartnerList />;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar
            className=""
            placeholder="회사명으로 검색"
            onSearch={handleSearch}
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/partners/new')}
            className="flex-none whitespace-nowrap rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600"
          >
            등록
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      )}

      {!loading && data && (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회사명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대표 전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주소
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      거래처가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.content.map((partner) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/partners/${partner.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {partner.companyName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {partner.mainPhone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {partner.address || '-'}
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

export default PartnerListPage;
