import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStore, setDefaultStore } from '@/api/store/store.ts';
import { acceptInvitation } from '@/api/store/invitation.ts';
import { setStorePublicId } from '@/utils/store';
import { Store, Ticket, ArrowRight, Loader2 } from 'lucide-react';

type ViewMode = 'select' | 'create' | 'join';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('select');

  // 새 매장 등록
  const [storeName, setStoreName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // 초대 코드 가입
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateStore = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!storeName.trim()) {
      setCreateError('매장명을 입력해주세요.');
      return;
    }

    if (!businessNumber.trim() || !/^\d{10}$/.test(businessNumber)) {
      setCreateError('사업자등록번호는 10자리 숫자여야 합니다.');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await createStore({
        name: storeName,
        businessRegistrationNumber: businessNumber
      });

      // 생성한 매장을 기본 매장으로 설정
      await setDefaultStore(response.storePublicId);
      setStorePublicId(response.storePublicId);

      // 대시보드로 이동
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setCreateError(err.response?.data?.message || '매장 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWithCode = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');

    if (!inviteCode.trim()) {
      setJoinError('초대 코드를 입력해주세요.');
      return;
    }

    setJoinLoading(true);
    try {
      const response = await acceptInvitation({
        code: inviteCode
      });

      // 가입한 매장을 기본 매장으로 설정
      if (response.storePublicId) {
        await setDefaultStore(response.storePublicId);
        setStorePublicId(response.storePublicId);
      }

      // 대시보드로 이동
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setJoinError('유효하지 않은 초대 코드입니다.');
      } else {
        setJoinError(err.response?.data?.message || '가입에 실패했습니다.');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  if (viewMode === 'select') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">매장 설정</h1>
            <p className="text-lg text-gray-600">
              새로운 매장을 등록하거나 초대 코드로 기존 매장에 가입하세요
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 새 매장 등록 */}
            <button
              onClick={() => setViewMode('create')}
              className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 text-left transition-all hover:border-black hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black transition-colors">
                  <Store className="w-8 h-8 text-gray-900 group-hover:text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">새 매장 등록</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                새로운 매장을 생성하고 재고 관리를 시작하세요. 대표 권한으로 모든 기능을 사용할 수 있습니다.
              </p>
            </button>

            {/* 초대 코드로 가입 */}
            <button
              onClick={() => setViewMode('join')}
              className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 text-left transition-all hover:border-black hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black transition-colors">
                  <Ticket className="w-8 h-8 text-gray-900 group-hover:text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">초대 코드로 가입</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                받은 초대 코드를 입력하여 기존 매장에 참여하세요. 매장 대표가 권한을 부여합니다.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Back Button */}
          <button
            onClick={() => setViewMode('select')}
            className="mb-8 text-sm text-gray-600 hover:text-black font-medium transition-colors"
          >
            ← 뒤로 가기
          </button>

          {/* Form */}
          <div className="border border-gray-200 rounded-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">새 매장 등록</h2>
              <p className="text-sm text-gray-600">매장 정보를 입력하여 새로운 매장을 생성하세요</p>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-6">
              <div>
                <label htmlFor="storeName" className="block text-sm font-semibold text-gray-900 mb-2">
                  매장명 <span className="text-red-600">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                  placeholder="예: 서울 강남점"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  사업자등록번호 <span className="text-red-600">*</span>
                </label>
                <input
                  id="businessNumber"
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                  placeholder="0000000000"
                  maxLength={10}
                  required
                />
                <p className="mt-2 text-xs text-gray-500">10자리 숫자를 입력해주세요</p>
              </div>

              {createError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{createError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    매장 생성 중...
                  </>
                ) : (
                  '매장 만들고 시작하기'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // viewMode === 'join'
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => setViewMode('select')}
          className="mb-8 text-sm text-gray-600 hover:text-black font-medium transition-colors"
        >
          ← 뒤로 가기
        </button>

        {/* Form */}
        <div className="border border-gray-200 rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">초대 코드로 가입</h2>
            <p className="text-sm text-gray-600">받은 초대 정보를 입력하여 매장에 참여하세요</p>
          </div>

          <form onSubmit={handleJoinWithCode} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-semibold text-gray-900 mb-2">
                초대 코드 <span className="text-red-600">*</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow font-mono tracking-wider"
                placeholder="12345678"
                required
              />
            </div>

            {joinError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{joinError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={joinLoading}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joinLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  가입 처리 중...
                </>
              ) : (
                '가입하고 시작하기'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
