import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { signIn } from '../api/auth';
import Alert from '../components/Alert';

/**
 * 로그인 페이지
 */
const LoginPage: React.FC = () => {
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
    
    // Validation
    if (!validate()) {
      // validation 실패 시 API 에러는 유지
      return;
    }

    // Validation 통과 후에만 에러 메시지 제거
    // (API 호출 직전에 제거하여 사용자가 에러 메시지를 볼 수 있도록)
    setApiError('');
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
    // 입력 시 validation 에러 메시지 제거
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // API 에러는 입력 시 바로 지우지 않음
    // 사용자가 에러 메시지를 읽을 수 있도록 유지
    // 다음 로그인 시도 시에만 제거 (handleSubmit에서 setApiError('') 처리)
  };

  const inputCls =
    'w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-gray-900 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-60';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-sm">
        {/* 로고 · 타이틀 */}
        <div className="mb-7 flex flex-col items-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/35">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
              <path d="M16 2.5v4M8 2.5v4M3 10h18M8.5 15l2.3 2.3 4.2-4.6" />
            </svg>
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">ScheduleFlow</h1>
          <p className="mt-1.5 text-sm font-medium text-gray-500">사내 일정·현장 관리</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 아이디 */}
          <div>
            <label htmlFor="username" className="mb-2 block text-[14px] font-bold text-gray-600">아이디</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="아이디 입력"
              disabled={loading}
              className={`${inputCls} ${errors.username ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.username && <p className="mt-1.5 text-[13px] font-semibold text-red-500">{errors.username}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="mb-2 block text-[14px] font-bold text-gray-600">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호 입력"
              disabled={loading}
              className={`${inputCls} ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.password && <p className="mt-1.5 text-[13px] font-semibold text-red-500">{errors.password}</p>}
          </div>

          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError('')} />}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-primary-500 py-3.5 text-[16px] font-extrabold text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-5 text-center text-[13.5px] font-semibold text-gray-500">
          계정이 없다면 관리자에게 발급을 요청하세요.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
