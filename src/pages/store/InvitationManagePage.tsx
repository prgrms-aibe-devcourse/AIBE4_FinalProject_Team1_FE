import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreByPublicId } from '@/api/store/store.ts';
import { createInvitation, getActiveInvitation, revokeActiveInvitation } from '@/api/store/invitation.ts';
import { requireStorePublicId } from '@/utils/store.ts';
import { Ticket, Loader2, Copy, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import type { InvitationItemResponse } from '@/types';

const InvitationManagePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeInvitation, setActiveInvitation] = useState<InvitationItemResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);
  const [error, setError] = useState('');

  const storePublicId = requireStorePublicId();

  useEffect(() => {
    const init = async () => {
      try {
        const store = await getStoreByPublicId(storePublicId);

        if (store.myRole !== 'OWNER') {
          setIsOwner(false);
          setLoading(false);
          return;
        }

        setIsOwner(true);
        await loadInvitation();
      } catch (err: any) {
        console.error('Failed to initialize:', err);
        setError(err.response?.data?.message || '초기화 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [storePublicId]);

  const loadInvitation = async () => {
    try {
      const invitation = await getActiveInvitation(storePublicId);
      setActiveInvitation(invitation);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setActiveInvitation(null);
      } else {
        setError('초대 정보를 불러오는데 실패했습니다.');
      }
    }
  };

  const handleCreateInvitation = async () => {
    setCreating(true);
    setError('');
    try {
      await createInvitation(storePublicId);
      await loadInvitation();
    } catch (err: any) {
      setError(err.response?.data?.message || '초대 코드 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeInvitation = async () => {
    if (!confirm('초대 코드를 취소하시겠습니까? 기존 코드는 더 이상 사용할 수 없습니다.')) {
      return;
    }

    setRevoking(true);
    setError('');
    try {
      await revokeActiveInvitation(storePublicId);
      setActiveInvitation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '초대 코드 취소에 실패했습니다.');
    } finally {
      setRevoking(false);
    }
  };

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}/invite?code=${code}`;
  };

  const handleCopy = async (text: string, type: 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <CheckCircle className="w-3 h-3" />
            활성
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            <Clock className="w-3 h-3" />
            만료됨
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            <XCircle className="w-3 h-3" />
            취소됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-6">
            초대 코드 관리는 매장 대표만 사용할 수 있습니다.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-black rounded-lg">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">초대 코드 관리</h1>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            초대 코드를 생성하여 직원을 매장에 초대하세요
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Active Invitation Card */}
        {activeInvitation ? (
          <div className="border-2 border-gray-900 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">현재 초대 코드</h2>
                <p className="text-sm text-gray-600">
                  아래 코드나 링크를 공유하여 직원을 초대하세요
                </p>
              </div>
              {getStatusBadge(activeInvitation.status)}
            </div>

            {/* Invite Code */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  초대 코드
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg font-bold tracking-widest text-center">
                    {activeInvitation.code}
                  </div>
                  <button
                    onClick={() => handleCopy(activeInvitation.code, 'code')}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold"
                  >
                    {copied === 'code' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Invite URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  초대 링크
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono break-all">
                    {getInviteUrl(activeInvitation.code)}
                  </div>
                  <button
                    onClick={() => handleCopy(getInviteUrl(activeInvitation.code), 'url')}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shrink-0"
                  >
                    {copied === 'url' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expiry Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                <Clock className="w-4 h-4" />
                <span>
                  유효기간: <span className="font-semibold text-gray-900">{formatDate(activeInvitation.expiresAt)}</span> 까지
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCreateInvitation}
                disabled={creating}
                className="flex-1 px-4 py-3 border border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    재발급 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    재발급
                  </>
                )}
              </button>
              <button
                onClick={handleRevokeInvitation}
                disabled={revoking}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {revoking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    취소 중...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    취소
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* No Active Invitation */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">활성화된 초대 코드가 없습니다</h2>
            <p className="text-gray-600 mb-6">
              새로운 초대 코드를 생성하여 직원을 초대하세요
            </p>
            <button
              onClick={handleCreateInvitation}
              disabled={creating}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  초대 코드 생성
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">안내사항</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>초대 코드는 매장당 1개만 발급할 수 있습니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>초대 코드를 재발급하면 기존 코드는 자동으로 만료됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>초대된 직원은 매장의 직원 권한으로 참여합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>취소된 초대 코드는 다시 사용할 수 없습니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvitationManagePage;
