import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-4"
        >
          목록으로
        </button>
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
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">거래처 직원 ({contacts.length}명)</h2>
          {isAdmin && !showContactForm && (
            <button
              onClick={handleOpenContactForm}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
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
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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

export default PartnerDetailPage;

