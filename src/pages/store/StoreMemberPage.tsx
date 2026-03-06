import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Trash2, Loader2 } from 'lucide-react';
import { getStoreMembers, updateMemberStatus } from '@/api/store/storeMember.ts';
import { requireStorePublicId } from '@/utils/store';
import type { StoreMemberResponse, StoreMemberRole } from '@/types';

const RoleBadge = ({ role }: { role: StoreMemberRole }) => {
  if (role === 'OWNER') {
    return (
      <span className="px-2 py-1 rounded bg-black text-white text-xs font-semibold">
        대표
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded bg-gray-200 text-gray-900 text-xs font-semibold">
      직원
    </span>
  );
};

export default function StoreMemberPage() {
  const storePublicId = requireStorePublicId();

  const [members, setMembers] = useState<StoreMemberResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getStoreMembers(storePublicId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load store members:", error);
      alert("직원 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleDeleteMember = async (member: StoreMemberResponse) => {
    const confirmed = window.confirm(
      `삭제하면 해당 직원의 접근 권한이 제거되며, 직원 목록에서 숨김 처리됩니다. 필요 시 다시 초대하여 추가할 수 있습니다.\n\n${member.userName}님을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setDeletingId(member.storeMemberId);
    try {
      await updateMemberStatus(storePublicId, member.storeMemberId, { status: 'INACTIVE' });
      loadMembers();
    } catch (error) {
      console.error("Failed to delete member:", error);
      alert(`직원 삭제에 실패했습니다.`);
    } finally {
      setDeletingId(null);
    }
  };

  // ACTIVE 상태의 멤버만 필터링하고 검색 적용
  const filteredMembers = useMemo(() => {
    return members
      .filter(member => member.status === 'ACTIVE')
      .filter(member => {
        const matchesSearch = member.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
  }, [members, searchTerm]);

  const activeCount = members.filter(m => m.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">직원 목록</h1>
              <p className="text-sm text-gray-600 mt-1">전체 멤버 {activeCount}명</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none focus:border-black bg-white transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider">권한</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">로딩 중...</p>
                  </td>
                </tr>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.storeMemberId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold">
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{member.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{member.userEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleDeleteMember(member)}
                          disabled={deletingId === member.storeMemberId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === member.storeMemberId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              삭제 중
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              삭제
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      {searchTerm
                        ? '검색 조건에 맞는 직원이 없습니다.'
                        : '등록된 직원이 없습니다.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
