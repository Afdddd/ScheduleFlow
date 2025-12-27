import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Header 컴포넌트
 * 
 * 기능:
 * 1. 로고 표시
 * 2. 사용자 프로필 표시
 * 3. 프로필 드롭다운 메뉴 (내 정보 / 로그아웃)
 * 
 *
 * 1. **드롭다운 상태 관리**
 *    - useState로 드롭다운 열림/닫힘 상태 관리
 *    - useRef와 useEffect로 외부 클릭 감지하여 드롭다운 닫기
 * 
 * 2. **로그아웃 처리**
 *    - authStore의 logout 함수 호출
 *    - 로그인 페이지로 리다이렉트
 * 
 * 3. **재사용성**
 *    - 전역 레이아웃에서 사용 가능
 *    - 모든 보호된 페이지에서 공통으로 표시
 */
const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* 로고 */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-800">ScheduleFlow</h1>
      </div>

      {/* 사용자 프로필 및 드롭다운 */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
          aria-label="프로필 메뉴"
        >
          {/* 사용자 아바타 */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.username.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* 사용자명 */}
          <span className="text-sm font-medium text-gray-700">{user?.username || 'User'}</span>
          
          {/* 드롭다운 아이콘 */}
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {/* 내 정보 */}
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                // TODO: 내 정보 페이지로 이동 (추후 구현)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              내 정보
            </button>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-1"></div>
            
            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

