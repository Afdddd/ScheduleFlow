import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../api/auth';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../api/types';

/**
 * 로그인 페이지
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 폼 validation
  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자명을 입력해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    // Validation
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await signIn(formData);
      // 로그인 성공 시 대시보드로 리다이렉트
      navigate('/');
    } catch (error) {
      // 에러 처리
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        setApiError(axiosError.response.data?.message || '로그인에 실패했습니다.');
      } else {
        setApiError('로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 입력 필드 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 입력 시 에러 메시지 제거
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>로그인</h1>

        <form onSubmit={handleSubmit}>
          {/* 사용자명 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              사용자명
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.username ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.username && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.username}
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.password ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.password && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* API 에러 메시지 */}
          {apiError && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                marginBottom: '20px',
                color: '#c33',
                fontSize: '14px',
              }}
            >
              {apiError}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>계정이 없으신가요? </span>
          <Link
            to="/signup"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
