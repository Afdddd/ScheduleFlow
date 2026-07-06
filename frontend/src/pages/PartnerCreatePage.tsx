import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { useScrollLock } from '../hooks/useScrollLock';
import {
  createPartner,
  createPartnerContact,
  PartnerCreateRequest,
  PartnerContactCreateRequest,
  PartnerContactResponse,
} from '../api/partner';

/**
 * 로컬 거래처 직원 타입 (서버 저장 전)
 */
interface LocalContact {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
}

const AVATAR_COLORS = ['#0B4EC4', '#1B9E5A', '#8B5CF6', '#C6771A', '#E5484D', '#0EA5E9'];

const inputCls =
  'h-[42px] w-full rounded-xl border border-gray-300 bg-white px-3.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelCls = 'mb-1.5 block text-[12.5px] font-bold text-gray-500';

/**
 * 거래처 등록 페이지 (2단계: ① 거래처 정보 → ② 직원 추가)
 * 데스크톱: 좌측 입력 + 우측 고정 요약 레일 / 모바일: 단일단 + 하단 시트
 */
const PartnerCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // 1단계: 거래처 정보
  const [companyName, setCompanyName] = useState<string>('');
  const [mainPhone, setMainPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // 2단계: 거래처 직원
  const [contacts, setContacts] = useState<PartnerContactResponse[]>([]);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<Partial<LocalContact>>({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
  });

  // 거래처 생성 후 상태
  const [createdPartnerId, setCreatedPartnerId] = useState<number | null>(null);

  // 상태
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingContact, setLoadingContact] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 거래처 생성
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!companyName.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const partnerRequest: PartnerCreateRequest = {
        companyName: companyName.trim(),
        mainPhone: mainPhone.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
      };

      const createdPartner = await createPartner(partnerRequest);
      setCreatedPartnerId(createdPartner.id);
      setSuccess('거래처가 등록되었어요. 이제 직원을 추가할 수 있어요.');
      setShowContactForm(false);
    } catch (error: any) {
      console.error('거래처 생성 실패:', error);
      setError(error.response?.data?.message || '거래처 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 거래처 직원 추가
  const handleAddContact = async () => {
    if (!createdPartnerId) return;
    setError(null);

    if (!newContact.name?.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoadingContact(true);

    try {
      const contactRequest: PartnerContactCreateRequest = {
        name: newContact.name.trim(),
        position: newContact.position?.trim() || null,
        department: newContact.department?.trim() || null,
        phone: newContact.phone?.trim() || null,
        email: newContact.email?.trim() || null,
      };

      const createdContact = await createPartnerContact(createdPartnerId, contactRequest);
      setContacts([...contacts, createdContact]);
      setNewContact({ name: '', position: '', department: '', phone: '', email: '' });
      setShowContactForm(false);
      setSuccess('직원이 추가되었어요.');
    } catch (error: any) {
      console.error('거래처 직원 추가 실패:', error);
      setError(error.response?.data?.message || '직원 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoadingContact(false);
    }
  };

  // 직원 폼 취소
  const handleCancelContactForm = () => {
    setShowContactForm(false);
    setNewContact({ name: '', position: '', department: '', phone: '', email: '' });
    setError(null);
  };

  // 완료
  const handleComplete = () => {
    navigate('/partners');
  };

  useScrollLock(showContactForm);

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-6 sm:px-6">
      <button
        onClick={() => navigate('/partners')}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        거래처 목록으로
      </button>
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">새 거래처</h1>
        <p className="mt-1 text-[13.5px] font-semibold text-gray-400">거래처 정보를 등록하고 담당 직원을 추가합니다.</p>
      </div>

      {error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1.25rem' }} />}
      {success && <Alert type="success" message={success} dismissible onClose={() => setSuccess(null)} style={{ marginBottom: '1.25rem' }} />}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-5">
        {/* 좌: 입력 */}
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* 1단계: 거래처 정보 */}
          <form onSubmit={handleCreatePartner} id="partnerForm">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[12px] font-extrabold text-white">1</span>
                <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">거래처 정보</h2>
                {createdPartnerId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11.5px] font-bold text-green-700">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                    등록됨
                  </span>
                )}
              </div>
              <fieldset disabled={!!createdPartnerId} className="space-y-4 disabled:opacity-60">
                <div>
                  <label className={labelCls}>
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="회사명을 입력하세요" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>대표 전화번호</label>
                    <input type="tel" value={mainPhone} onChange={(e) => setMainPhone(e.target.value)} className={inputCls} placeholder="02-000-0000" />
                  </div>
                  <div>
                    <label className={labelCls}>주소</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="주소를 입력하세요" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>설명</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputCls} h-auto py-2.5 leading-relaxed`}
                    placeholder="거래처에 대한 설명을 입력하세요"
                  />
                </div>
              </fieldset>
            </section>
          </form>

          {/* 2단계: 거래처 직원 (거래처 등록 후) */}
          <section className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${createdPartnerId ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold text-white ${createdPartnerId ? 'bg-primary-500' : 'bg-gray-300'}`}>2</span>
              <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">거래처 직원</h2>
              {contacts.length > 0 && (
                <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-50 px-1.5 text-[11.5px] font-extrabold text-primary-600">{contacts.length}</span>
              )}
              <div className="flex-1" />
              <button
                type="button"
                disabled={!createdPartnerId}
                onClick={() => setShowContactForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                직원 추가
              </button>
            </div>

            {!createdPartnerId ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13px] font-semibold text-gray-400">
                거래처를 먼저 등록하면 직원을 추가할 수 있어요.
              </div>
            ) : contacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13px] font-semibold text-gray-400">
                아직 추가된 직원이 없어요. ‘직원 추가’로 등록하세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {contacts.map((contact, i) => (
                  <div key={contact.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-3">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
                      style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {contact.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-extrabold text-gray-900">{contact.name}</span>
                        {contact.position && <span className="flex-none rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">{contact.position}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] font-semibold text-gray-500">
                        {contact.department && <span>{contact.department}</span>}
                        {contact.phone && <span className="tabular-nums">{contact.phone}</span>}
                        {contact.email && <span className="truncate">{contact.email}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 우: 요약 + 액션 레일 */}
        <div className="mt-4 space-y-3.5 lg:sticky lg:top-4 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-[18px] pt-3.5 text-[11.5px] font-extrabold tracking-wide text-gray-400">미리보기</div>
            <div className="flex items-center gap-2.5 border-b border-gray-200 px-[18px] pb-3.5 pt-1.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary-50 text-[13px] font-extrabold text-primary-600">
                {companyName.charAt(0) || '거'}
              </span>
              <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">{companyName || '거래처명'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">대표 전화</span>
              <span className="truncate text-[13px] font-bold text-gray-800 tabular-nums">{mainPhone || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="flex-none text-[12.5px] font-bold text-gray-400">주소</span>
              <span className="truncate text-[13px] font-bold text-gray-800">{address || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">직원</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">{contacts.length}명</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {!createdPartnerId ? (
              <>
                <button
                  type="submit"
                  form="partnerForm"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? '등록 중…' : '거래처 등록'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/partners')}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white text-[14px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  취소
                </button>
                <p className="text-center text-[11.5px] font-semibold text-gray-400">등록 후 직원을 추가할 수 있어요.</p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600"
                >
                  완료
                </button>
                <p className="text-center text-[11.5px] font-semibold text-gray-400">직원은 거래처 상세에서도 추가할 수 있어요.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 직원 추가 — 모달(데스크톱 중앙) / 하단 시트(모바일) */}
      {showContactForm && createdPartnerId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-gray-900/50" onClick={handleCancelContactForm} />
          <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[540px] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[17px] font-extrabold text-gray-900">직원 추가</h3>
              <button
                type="button"
                onClick={handleCancelContactForm}
                aria-label="닫기"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18 18 6" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5">
              <div>
                <label className={labelCls}>
                  이름 <span className="text-red-500">*</span>
                </label>
                <input type="text" value={newContact.name || ''} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className={inputCls} placeholder="이름을 입력하세요" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>직급</label>
                  <input type="text" value={newContact.position || ''} onChange={(e) => setNewContact({ ...newContact, position: e.target.value })} className={inputCls} placeholder="예: 구매 부장" />
                </div>
                <div>
                  <label className={labelCls}>부서</label>
                  <input type="text" value={newContact.department || ''} onChange={(e) => setNewContact({ ...newContact, department: e.target.value })} className={inputCls} placeholder="예: 구매팀" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>전화번호</label>
                  <input type="tel" value={newContact.phone || ''} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className={inputCls} placeholder="010-0000-0000" />
                </div>
                <div>
                  <label className={labelCls}>이메일</label>
                  <input type="email" value={newContact.email || ''} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className={inputCls} placeholder="name@company.co.kr" />
                </div>
              </div>
              {error && <p className="text-[13px] font-semibold text-red-500">{error}</p>}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={handleCancelContactForm}
                className="flex h-[42px] items-center rounded-xl border border-gray-300 bg-white px-4 text-[14px] font-bold text-gray-600 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddContact}
                disabled={loadingContact}
                className="flex h-[42px] items-center rounded-xl bg-primary-500 px-5 text-[14px] font-extrabold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loadingContact ? '추가 중…' : '직원 추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerCreatePage;
