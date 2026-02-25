import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
        <p className="mt-4 text-2xl font-semibold text-gray-700">페이지를 찾을 수 없습니다</p>
        <p className="mt-2 text-gray-600">요청하신 페이지가 존재하지 않습니다.</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700"
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
