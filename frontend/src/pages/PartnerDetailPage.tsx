import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useSmartBack } from '../hooks/useSmartBack';
import Alert from '../components/Alert';
import { useAuthStore } from '../stores/authStore';
import {
  getPartnerDetail,
  getPartnerContacts,
  updatePartner,
  deletePartner,
  createPartnerContact,
  updatePartnerContact,
  deletePartnerContact,
  PartnerResponse,
  PartnerUpdateRequest,
  PartnerContactResponse,
  PartnerContactCreateRequest,
  PartnerContactUpdateRequest,
} from '../api/partner';

/**
 * 거래처 상세 페이지
 *
 * 기능:
 * 1. 거래처 상세 정보 조회
 * 2. 거래처 수정 (ADMIN 권한)
 * 3. 거래처 삭제 (ADMIN 권한)
 * 4. 거래처 직원 목록 조회
 * 5. 거래처 직원 추가 (ADMIN 권한)
 * 6. 거래처 직원 수정 (ADMIN 권한)
 * 7. 거래처 직원 삭제 (ADMIN 권한)
 */
const PartnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isMobile = useIsMobile();
  const goBack = useSmartBack('/partners');

  // 거래처 데이터
  const [partner, setPartner] = useState<PartnerResponse | null>(null);
  const [contacts, setContacts] = useState<PartnerContactResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 편집 모드 상태
  const [companyName, setCompanyName] = useState<string>('');
  const [mainPhone, setMainPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // 거래처 직원 추가/편집
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Partial<PartnerContactResponse>>({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
  });
  const [loadingContact, setLoadingContact] = useState<boolean>(false);

  // 거래처 데이터 로딩
  useEffect(() => {
    if (!id) return;

    const loadPartner = async () => {
      setLoading(true);
      setError(null);
      try {
        const partnerId = parseInt(id, 10);
        const [partnerData, contactsData] = await Promise.all([
          getPartnerDetail(partnerId),
          getPartnerContacts(partnerId),
        ]);
        setPartner(partnerData);
        setContacts(contactsData);
      } catch (error: any) {
        console.error('거래처 로딩 실패:', error);
        if (error.response?.status === 404) {
          setError('거래처를 찾을 수 없습니다.');
        } else {
          setError('거래처 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPartner();
  }, [id]);

  // 거래처 데이터를 편집 모드 상태로 복사
  useEffect(() => {
    if (partner && isEditing) {
      setCompanyName(partner.companyName || '');
      setMainPhone(partner.mainPhone || '');
      setAddress(partner.address || '');
      setDescription(partner.description || '');
    }
  }, [partner, isEditing]);

  // 편집 모드 진입
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // 원본 데이터로 복원
    if (partner) {
      setCompanyName(partner.companyName || '');
      setMainPhone(partner.mainPhone || '');
      setAddress(partner.address || '');
      setDescription(partner.description || '');
    }
  };

  // 거래처 수정 저장
  const handleSave = async () => {
    if (!id || !partner) return;

    setError(null);

    // 검증
    if (!companyName.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const partnerId = parseInt(id, 10);
      const updateRequest: PartnerUpdateRequest = {
        id: partnerId,
        companyName: companyName.trim(),
        mainPhone: mainPhone.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
      };

      const updatedPartner = await updatePartner(updateRequest);
      setPartner(updatedPartner);
      setIsEditing(false);
      setError(null);
    } catch (error: any) {
      console.error('거래처 수정 실패:', error);
      setError(error.response?.data?.message || '거래처 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 거래처 삭제
  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      '정말로 이 거래처를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const partnerId = parseInt(id, 10);
      await deletePartner(partnerId);
      navigate('/partners');
    } catch (error: any) {
      console.error('거래처 삭제 실패:', error);
      setError(error.response?.data?.message || '거래처 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 직원 추가 폼 열기
  const handleOpenContactForm = () => {
    setShowContactForm(true);
    setEditingContactId(null);
    setNewContact({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
    });
    setError(null);
  };

  // 직원 편집 폼 열기
  const handleEditContact = (contact: PartnerContactResponse) => {
    setShowContactForm(true);
    setEditingContactId(contact.id);
    setNewContact({
      name: contact.name,
      position: contact.position || '',
      department: contact.department || '',
      phone: contact.phone || '',
      email: contact.email || '',
    });
    setError(null);
  };

  // 직원 폼 취소
  const handleCancelContactForm = () => {
    setShowContactForm(false);
    setEditingContactId(null);
    setNewContact({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
    });
    setError(null);
  };

  // 직원 추가/수정
  const handleSaveContact = async () => {
    if (!id) return;

    setError(null);

    // 검증
    if (!newContact.name?.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoadingContact(true);

    try {
      const partnerId = parseInt(id, 10);

      if (editingContactId) {
        // 수정
        const updateRequest: PartnerContactUpdateRequest = {
          id: editingContactId,
          name: newContact.name.trim(),
          position: newContact.position?.trim() || null,
          department: newContact.department?.trim() || null,
          phone: newContact.phone?.trim() || null,
          email: newContact.email?.trim() || null,
        };

        const updatedContact = await updatePartnerContact(partnerId, updateRequest);
        setContacts(contacts.map((c) => (c.id === editingContactId ? updatedContact : c)));
      } else {
        // 추가
        const createRequest: PartnerContactCreateRequest = {
          name: newContact.name.trim(),
          position: newContact.position?.trim() || null,
          department: newContact.department?.trim() || null,
          phone: newContact.phone?.trim() || null,
          email: newContact.email?.trim() || null,
        };

        const createdContact = await createPartnerContact(partnerId, createRequest);
        setContacts([...contacts, createdContact]);
      }

      handleCancelContactForm();
    } catch (error: any) {
      console.error('거래처 직원 추가/수정 실패:', error);
      setError(error.response?.data?.message || '직원 추가/수정에 실패했습니다.');
    } finally {
      setLoadingContact(false);
    }
  };

  // 직원 삭제
  const handleDeleteContact = async (contactId: number) => {
    if (!id) return;

    const confirmed = window.confirm('정말로 이 직원을 삭제하시겠습니까?');
    if (!confirmed) return;

    setLoadingContact(true);
    setError(null);

    try {
      const partnerId = parseInt(id, 10);
      await deletePartnerContact(partnerId, contactId);
      setContacts(contacts.filter((c) => c.id !== contactId));
    } catch (error: any) {
      console.error('거래처 직원 삭제 실패:', error);
      setError(error.response?.data?.message || '직원 삭제에 실패했습니다.');
    } finally {
      setLoadingContact(false);
    }
  };

  if (loading && !partner) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || '거래처를 찾을 수 없습니다.'} />
        <button
          onClick={() => navigate('/partners')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors mt-4"
        >
          목록으로
        </button>
      </div>
    );
  }

  // ── 모바일 읽기 뷰 (편집은 아래 공용 폼 재사용) ──
  if (isMobile && !isEditing) {
    return (
      <div className="min-h-full bg-gray-50 pb-10">
        <div className="flex items-center gap-1 px-2.5 pb-3 pt-3">
          <button onClick={goBack} aria-label="뒤로" className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 active:bg-gray-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="flex-1 text-center text-[17px] font-extrabold tracking-tight text-gray-900">거래처 상세</h1>
          <span className="w-10" />
        </div>

        <div className="px-[18px]">
          {error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1rem' }} />}

          <h2 className="text-[23px] font-extrabold leading-tight tracking-tight text-gray-900">{partner.companyName}</h2>

          {/* 전화·문자 바로가기 */}
          {partner.mainPhone && (
            <div className="mt-3.5 flex gap-2.5">
              <a href={`tel:${partner.mainPhone}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-[15px] font-extrabold text-green-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                전화
              </a>
              <a href={`sms:${partner.mainPhone}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-50 py-3 text-[15px] font-extrabold text-primary-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
                문자
              </a>
            </div>
          )}

          {/* 정보 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            <PRow label="대표전화" value={partner.mainPhone || '-'} />
            <PRow label="주소" value={partner.address || '-'} />
            <PRow label="설명" value={partner.description || '-'} last />
          </div>

          {/* 담당자 */}
          <div className="mb-2 mt-5 flex items-baseline gap-2 px-0.5">
            <span className="text-[15px] font-extrabold text-gray-900">담당자</span>
            <span className="text-[13px] font-bold text-gray-400">{contacts.length}</span>
          </div>
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13.5px] font-semibold text-gray-400">등록된 담당자가 없어요</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {contacts.map((c, i) => (
                <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-gray-900">
                      {c.name}
                      {(c.position || c.department) && <span className="text-[12.5px] font-semibold text-gray-400"> · {[c.department, c.position].filter(Boolean).join(' ')}</span>}
                    </div>
                    {c.phone && <div className="text-[12.5px] font-medium text-gray-500">{c.phone}</div>}
                  </div>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-green-50 text-green-600" aria-label={`${c.name} 전화`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="mt-6 flex gap-2.5">
              <button onClick={handleEdit} className="flex-1 rounded-2xl bg-primary-500 py-4 text-[16px] font-extrabold text-white shadow-sm active:scale-[0.99]">수정</button>
              <button onClick={handleDelete} className="flex-1 rounded-2xl border border-red-200 bg-white py-4 text-[16px] font-extrabold text-red-500 active:scale-[0.99]">삭제</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{partner.companyName}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/partners')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            목록으로
          </button>
          {isAdmin && (
            <>
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onClose={() => setError(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* 기본 정보 섹션 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">기본 정보</h2>

        <div className="space-y-4">
          {/* 회사명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
            {isEditing ? (
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="회사명을 입력하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900">{partner.companyName}</div>
            )}
          </div>

          {/* 대표 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 전화번호</label>
            {isEditing ? (
              <input
                type="tel"
                value={mainPhone}
                onChange={(e) => setMainPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="대표 전화번호를 입력하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900">{partner.mainPhone || '-'}</div>
            )}
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            {isEditing ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="주소를 입력하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900">{partner.address || '-'}</div>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="거래처에 대한 설명을 입력하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900 whitespace-pre-wrap">
                {partner.description || '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 거래처 직원 섹션 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">거래처 직원 ({contacts.length}명)</h2>
          {isAdmin && !showContactForm && (
            <button
              onClick={handleOpenContactForm}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              직원 추가
            </button>
          )}
        </div>

        {/* 직원 추가/편집 폼 */}
        {showContactForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              {editingContactId ? '직원 수정' : '직원 추가'}
            </h3>

            <div className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newContact.name || ''}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="이름을 입력하세요"
                />
              </div>

              {/* 직급 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                <input
                  type="text"
                  value={newContact.position || ''}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="직급을 입력하세요"
                />
              </div>

              {/* 부서 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                <input
                  type="text"
                  value={newContact.department || ''}
                  onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="부서를 입력하세요"
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancelContactForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={loadingContact}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingContact ? '저장 중...' : editingContactId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        )}

        {/* 직원 목록 */}
        {contacts.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg text-center">
            등록된 직원이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    {contact.position && (
                      <div className="text-sm text-gray-500">{contact.position}</div>
                    )}
                  </div>
                </div>
                {contact.department && (
                  <div className="text-sm text-gray-600 mb-1">부서: {contact.department}</div>
                )}
                {contact.phone && (
                  <div className="text-sm text-gray-600 mb-1">전화: {contact.phone}</div>
                )}
                {contact.email && (
                  <div className="text-sm text-gray-600 mb-3">이메일: {contact.email}</div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** 모바일 상세 정보 행. */
const PRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <div className={`flex gap-3 py-3.5 ${last ? '' : 'border-b border-gray-100'}`}>
    <span className="w-16 flex-none text-[13px] font-semibold text-gray-400">{label}</span>
    <span className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] font-bold text-gray-900">{value}</span>
  </div>
);

export default PartnerDetailPage;

