import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * 프로젝트 상세 페이지
 * TODO: Issue #10에서 구현 예정
 */
const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: '20px' }}>
      <h1>프로젝트 상세</h1>
      <p>프로젝트 ID: {id}</p>
      <p>프로젝트 상세 정보가 여기에 표시됩니다.</p>
    </div>
  );
};

export default ProjectDetailPage;

