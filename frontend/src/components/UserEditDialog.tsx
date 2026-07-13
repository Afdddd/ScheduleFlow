import React, { useEffect, useState } from 'react';
import BottomSheet from './ui/BottomSheet';
import TextField from './ui/TextField';
import { updateUser, deleteUser } from '../api/user';
import { UserListResponse } from '../api/list';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * UserEditDialog — 사원 정보 수정 (ADMIN 전용, 사원관리에서 사용). (#111)
 *
 * 이름/전화번호/이메일/직책만 수정한다. 아이디는 표시만(수정 불가),
 * 비밀번호·역할 변경은 범위 제외. 삭제는 확인 다이얼로그를 거친다.
 * 모바일은 BottomSheet, 데스크톱은 중앙 모달로 같은 폼을 렌더한다.
 */

interface Props {
  open: boolean;
  user: UserListResponse | null;
  onClose: () => void;
  /** 수정/삭제 성공 시 호출 — 목록 갱신용 */
  onSaved: () => void;
}

const UserEditDialog: React.FC<Props> = ({ open, user, onClose, onSaved }) => {
  const isMobile = useIsMobile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열릴 때 대상 사원 정보로 초기화
  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setPhone(user.phone);
    setEmail(user.email ?? '');
    setPosition(user.position ?? '');
    setError(null);
  }, [open, user]);

  const submit = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) return setError('이름을 입력해 주세요.');
    if (!phone.trim()) return setError('전화번호를 입력해 주세요.');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('올바른 이메일 형식이 아니에요.');

    setSaving(true);
    try {
      await updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        position: position.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      console.error('사원 수정 실패:', e);
      setError(e.response?.data?.message || '사원 수정에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user) return;
    const confirmed = window.confirm(`'${user.name}' 사원을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await deleteUser(user.id);
      onSaved();
      onClose();
    } catch (e: any) {
      console.error('사원 삭제 실패:', e);
      setError(e.response?.data?.message || '사원 삭제에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <div className="flex flex-col gap-5 pt-1">
      {/* 아이디 — 수정 불가 표시 */}
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-600">
          아이디 <span className="ml-1.5 font-medium text-gray-400">(수정 불가)</span>
        </label>
        <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3.5 text-base font-medium text-gray-500">
          {user?.username}
        </div>
      </div>
      <TextField label="이름" value={name} onChange={setName} placeholder="홍길동" />
      <TextField label="전화번호" value={phone} onChange={setPhone} type="tel" placeholder="010-0000-0000" />
      <TextField label="이메일" value={email} onChange={setEmail} type="email" hint="(안 써도 돼요)" placeholder="example@company.com" />
      <TextField label="직책" value={position} onChange={setPosition} hint="(안 써도 돼요)" placeholder="예: 현장소장" />
      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={saving}
        className="rounded-xl border border-red-200 bg-white py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        사원 삭제
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="사원 정보 수정"
        confirmLabel={saving ? '저장 중…' : '저장'}
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
          <h2 className="text-lg font-extrabold text-gray-900">사원 정보 수정</h2>
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
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditDialog;
