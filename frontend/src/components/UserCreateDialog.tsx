import React, { useEffect, useState } from 'react';
import BottomSheet from './ui/BottomSheet';
import TextField from './ui/TextField';
import { signUp } from '../api/auth';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * UserCreateDialog — 사원 등록 (ADMIN 전용, 사원관리에서 사용).
 *
 * 셀프 회원가입 대신 관리자가 계정을 발급하는 흐름(백엔드 /auth/sign-up이 ADMIN 전용).
 * 모바일은 BottomSheet, 데스크톱은 중앙 모달로 같은 폼을 렌더한다.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  /** 등록 성공 시 호출 — 목록 갱신용 */
  onCreated: () => void;
}

const UserCreateDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const isMobile = useIsMobile();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열릴 때 폼 초기화
  useEffect(() => {
    if (!open) return;
    setUsername('');
    setPassword('');
    setName('');
    setPhone('');
    setEmail('');
    setError(null);
  }, [open]);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('이름을 입력해 주세요.');
    if (!username.trim()) return setError('아이디를 입력해 주세요.');
    if (password.length < 8 || password.length > 20) return setError('비밀번호는 8~20자로 입력해 주세요.');
    if (!phone.trim()) return setError('전화번호를 입력해 주세요.');

    setSaving(true);
    try {
      await signUp({
        username: username.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      console.error('사원 등록 실패:', e);
      setError(e.response?.data?.message || '사원 등록에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <div className="flex flex-col gap-5 pt-1">
      <TextField label="이름" value={name} onChange={setName} placeholder="홍길동" />
      <TextField label="아이디" value={username} onChange={setUsername} placeholder="로그인에 쓸 아이디" />
      <TextField label="비밀번호" value={password} onChange={setPassword} type="password" placeholder="8~20자" />
      <TextField label="전화번호" value={phone} onChange={setPhone} type="tel" placeholder="010-0000-0000" />
      <TextField label="이메일" value={email} onChange={setEmail} type="email" hint="(안 써도 돼요)" placeholder="example@company.com" />
      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-600">{error}</p>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="사원 등록"
        confirmLabel={saving ? '등록 중…' : '등록'}
        onConfirm={saving ? undefined : submit}
      >
        {form}
      </BottomSheet>
    );
  }

  // 데스크톱: 중앙 모달
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-extrabold text-gray-900">사원 등록</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{form}</div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? '등록 중…' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCreateDialog;
