import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
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

/**
 * 거래처 등록 페이지
 *
 * 기능:
 * 1. 거래처 기본 정보 입력 (1단계)
 * 2. 거래처 생성
 * 3. 거래처 직원 추가 (2단계)
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

    // 검증
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
      setSuccess('거래처가 성공적으로 등록되었습니다. 이제 직원을 추가할 수 있습니다.');
      setShowContactForm(true);
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

    // 검증
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
      setNewContact({
        name: '',
        position: '',
        department: '',
        phone: '',
        email: '',
      });
      setShowContactForm(false);
      setSuccess('직원이 성공적으로 추가되었습니다.');
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
    setNewContact({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
    });
    setError(null);
  };

  // 완료
  const handleComplete = () => {
    navigate('/partners');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">거래처 등록</h1>
        <button
          onClick={() => navigate('/partners')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          목록으로
        </button>
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

      {success && (
        <Alert
          type="success"
          message={success}
          dismissible
          onClose={() => setSuccess(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* 1단계: 거래처 정보 입력 */}
      {!createdPartnerId && (
        <form onSubmit={handleCreatePartner}>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">거래처 정보</h2>

            <div className="space-y-4">
              {/* 회사명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="회사명을 입력하세요"
                  required
                />
              </div>

              {/* 대표 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표 전화번호
                </label>
                <input
                  type="tel"
                  value={mainPhone}
                  onChange={(e) => setMainPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="대표 전화번호를 입력하세요"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="주소를 입력하세요"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="거래처에 대한 설명을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/partners')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : '거래처 등록'}
            </button>
          </div>
        </form>
      )}

      {/* 2단계: 거래처 직원 추가 */}
      {createdPartnerId && (
        <div>
          {/* 추가된 직원 목록 */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">추가된 직원 ({contacts.length}명)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
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
                      <div className="text-sm text-gray-600">이메일: {contact.email}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 직원 추가 폼 */}
          {showContactForm ? (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">직원 추가</h2>

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
                  onClick={handleAddContact}
                  disabled={loadingContact}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loadingContact ? '추가 중...' : '직원 추가'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">거래처 직원 관리</h2>
                  <p className="text-sm text-gray-500">
                    거래처 직원을 추가하거나 완료 버튼을 눌러 목록으로 돌아갈 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  직원 추가하기
                </button>
              </div>
            </div>
          )}

          {/* 완료 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerCreatePage;

