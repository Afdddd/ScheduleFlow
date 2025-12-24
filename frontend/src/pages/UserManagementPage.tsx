import React from 'react';

/**
 * 사원 관리 페이지 (ADMIN 권한 필요)
 * TODO: Issue #14에서 구현 예정
 */
const UserManagementPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>사원 관리</h1>
      <p>사원 목록이 여기에 표시됩니다. (ADMIN 권한 필요)</p>
    </div>
  );
};

export default UserManagementPage;

