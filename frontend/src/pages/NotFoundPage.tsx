import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 페이지
 * 존재하지 않는 경로로 접근했을 때 표시
 */
const NotFoundPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      marginTop: '100px'
    }}>
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link to="/" style={{ color: '#61dafb' }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
};

export default NotFoundPage;

