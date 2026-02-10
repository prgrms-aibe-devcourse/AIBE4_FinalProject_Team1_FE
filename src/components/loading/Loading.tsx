import Lottie from 'react-lottie-player';
// 영수증 관련 로띠 파일이 있다면 그걸 쓰고, 없으면 기존 loading.json 재사용
import loadingJson from '../../components/loading/Loading.json';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="w-48 h-48">
                <Lottie
                    loop
                    animationData={loadingJson}
                    play
                    style={{width: '100%', height: '100%'}}
                />
            </div>

            <div className="text-center space-y-1">
                <h3 className="text-sm text-slate-500">
                    잠시만 기다려주세요...
                </h3>
            </div>
        </div>
    );
}