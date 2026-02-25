import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvitation } from '@/api/invitation';
import { setDefaultStore } from '@/api/store';
import { CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import axios from 'axios';
import type { ApiError } from '@/types/common';

type InviteStatus = 'loading' | 'success' | 'error';

const InviteLandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [storeName, setStoreName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processInvitation = async () => {
      try {
        // URL에서 파라미터 추출
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const storeIdParam = searchParams.get('storeId');

        // 유효성 검사
        if (!token && (!code || !storeIdParam)) {
          setStatus('error');
          setErrorMessage('초대 정보가 올바르지 않습니다. 초대 링크를 다시 확인해주세요.');
          return;
        }

        // 초대 수락 요청
        const response = await acceptInvitation({
          token: token || undefined,
          code: code || undefined,
          storeId: storeIdParam ? parseInt(storeIdParam, 10) : undefined,
        });

        setStatus('success');
        setStoreName(response.storeName);

        // 가입한 매장을 기본 매장으로 설정
        if (response.storeId) {
          await setDefaultStore(response.storeId);
        }

        // 3초 후 대시보드로 이동
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 3000);
      } catch (err: unknown) {
        setStatus('error');
        if (axios.isAxiosError<ApiError>(err)) {
          if (err.response?.status === 404) {
            setErrorMessage('유효하지 않은 초대입니다. 초대가 만료되었거나 이미 사용되었을 수 있습니다.');
          } else if (err.response?.status === 400) {
            setErrorMessage('잘못된 초대 정보입니다.');
          } else {
            setErrorMessage(err.response?.data?.message || '초대 처리 중 오류가 발생했습니다.');
          }
        } else {
          setErrorMessage('초대 처리 중 예상치 못한 오류가 발생했습니다.');
        }
      }
    };

    processInvitation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-4">
              <UserPlus className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">매장 초대</h1>
            <p className="text-gray-600 text-sm">초대를 처리하고 있습니다</p>
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">초대를 확인하는 중입니다</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">초대 수락 완료</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-900 font-semibold">{storeName}</p>
                  <p className="text-gray-600 text-sm mt-1">매장에 성공적으로 참여했습니다</p>
                </div>
                <p className="text-gray-600 text-sm">잠시 후 대시보드로 이동합니다</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    지금 이동하기
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">초대 처리 실패</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/stores/manage')}
                    className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    매장 관리로 이동
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    대시보드로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              초대와 관련하여 문제가 있으신가요?<br />
              매장 관리자에게 문의하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteLandingPage;
