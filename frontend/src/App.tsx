import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import apiClient, { setAuthToken, getAuthToken, removeAuthToken } from './api/client';

function App() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 테스트 1: 로그인 API 호출
  const testLogin = async () => {
    setLoading(true);
    setTestResult('로그인 테스트 중...');
    
    try {
      // 백엔드 auth-test.http 파일 참고
      const response = await apiClient.post('/auth/sign-in', {
        username: 'admin',
        password: 'password123'
      });
      
      const token = response.data;
      setAuthToken(token);
      setTestResult(`✅ 로그인 성공! 토큰: ${token.substring(0, 20)}...`);
    } catch (error: any) {
      if (error.response) {
        // 백엔드에서 에러 응답
        setTestResult(`❌ 로그인 실패: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못함 (백엔드 서버가 꺼져있을 가능성)
        setTestResult('❌ 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
      } else {
        setTestResult(`❌ 에러: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 테스트 2: 토큰 확인
  const testToken = () => {
    const token = getAuthToken();
    if (token) {
      setTestResult(`✅ 토큰 저장됨: ${token.substring(0, 20)}...`);
    } else {
      setTestResult('❌ 토큰이 없습니다. 먼저 로그인을 시도하세요.');
    }
  };

  // 테스트 3: 인증 필요한 API 호출 (토큰 자동 첨부 확인)
  const testAuthenticatedApi = async () => {
    setLoading(true);
    setTestResult('인증된 API 호출 테스트 중...');
    
    try {
      const response = await apiClient.get('/projects');
      setTestResult(`✅ 프로젝트 목록 조회 성공! (${response.data.length}개)`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setTestResult('❌ 401 에러: 인증 실패 (토큰이 없거나 만료됨)');
      } else if (error.response) {
        setTestResult(`❌ 에러: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        setTestResult('❌ 백엔드 서버에 연결할 수 없습니다.');
      } else {
        setTestResult(`❌ 에러: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 테스트 4: 토큰 삭제
  const testLogout = () => {
    removeAuthToken();
    setTestResult('✅ 토큰 삭제됨');
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          API 클라이언트 테스트
        </p>
        <p style={{ fontSize: '14px', marginTop: '20px' }}>
          API Base URL: {process.env.REACT_APP_API_BASE_URL || 'Not set'}
        </p>
        
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={testLogin} 
            disabled={loading}
            style={{ padding: '10px 20px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            1. 로그인 테스트
          </button>
          <button 
            onClick={testToken} 
            style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
          >
            2. 토큰 확인
          </button>
          <button 
            onClick={testAuthenticatedApi} 
            disabled={loading}
            style={{ padding: '10px 20px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            3. 인증된 API 호출 테스트
          </button>
          <button 
            onClick={testLogout} 
            style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
          >
            4. 토큰 삭제
          </button>
        </div>

        {testResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: 'rgba(0,0,0,0.3)', 
            borderRadius: '5px',
            maxWidth: '600px',
            wordBreak: 'break-word'
          }}>
            <p style={{ fontSize: '14px', margin: 0 }}>{testResult}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
