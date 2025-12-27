import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { signUp } from '../api/auth';
import Alert from '../components/Alert';

/**
 * 회원가입 페이지
 */
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 이미 로그인한 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    passwordConfirm?: string;
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [apiError, setApiError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 폼 validation
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자명을 입력해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!validate()) {
      // validation 실패 시 API 에러는 유지
      return;
    }

    // Validation 통과 후에만 에러 메시지 제거
    setApiError('');
    setLoading(true);

    try {
      // email이 비어있으면 undefined로 전송 (백엔드에서 optional)
      const requestData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email.trim() || undefined,
        phone: formData.phone,
      };

      await signUp(requestData);
      // 회원가입 성공 시 로그인 페이지로 리다이렉트
      navigate('/login');
    } catch (error) {
      // 에러 처리
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        setApiError(axiosError.response.data?.message || '회원가입에 실패했습니다.');
      } else {
        setApiError('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 입력 필드 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 입력 시 validation 에러 메시지 제거
    if (errors[name as keyof typeof errors]) {
      setErrors((prev: typeof errors) => ({ ...prev, [name]: undefined }));
    }
    // API 에러는 입력 시 바로 지우지 않음
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
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
        <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>회원가입</h1>

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
              사용자명 *
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
              비밀번호 *
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

          {/* 비밀번호 확인 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="passwordConfirm"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              비밀번호 확인 *
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.passwordConfirm ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.passwordConfirm && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.passwordConfirm}
              </p>
            )}
          </div>

          {/* 이름 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.name ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.name && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* 이메일 입력 (선택) */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.email ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.email && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* 전화번호 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="phone"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              전화번호 *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.phone ? '#e74c3c' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            {errors.phone && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '4px' }}>
                {errors.phone}
              </p>
            )}
          </div>

          {/* API 에러 메시지 */}
          {apiError && (
            <Alert
              type="error"
              message={apiError}
              onClose={() => setApiError('')}
            />
          )}

          {/* 회원가입 버튼 */}
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
            {loading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>이미 계정이 있으신가요? </span>
          <Link
            to="/login"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
