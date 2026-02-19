# API Services

백엔드 API와 통신하기 위한 서비스 모듈입니다.

## 구조

```
src/services/api/
├── client.ts      # axios 인스턴스 (JWT 토큰 자동 첨부)
├── auth.ts        # 인증 관련 API
├── products.ts    # 상품 관련 API 예시
└── index.ts       # 통합 export
```

## 환경변수 설정

`.env.local` 파일에 백엔드 API URL을 설정하세요:

```env
VITE_API_BASE_URL=https://api.inventorykitchen.cloud
```

## 사용 예시

### 1. 개별 API 함수 import

```typescript
import { login, getMe } from '@/services/api/auth';
import { getProducts, createProduct } from '@/services/api/products';

// 로그인
const response = await login({ email, password });
localStorage.setItem('accessToken', response.data.accessToken);

// 상품 목록 조회
const products = await getProducts();
```

### 2. apiClient 직접 사용

```typescript
import apiClient from '@/services/api/client';

// GET 요청
const response = await apiClient.get('/api/some-endpoint');

// POST 요청
const response = await apiClient.post('/api/some-endpoint', {
  key: 'value',
});
```

## 인증 처리

`client.ts`에서 자동으로 처리됩니다:

- **요청 인터셉터**: `localStorage`의 `accessToken`을 자동으로 `Authorization` 헤더에 추가
- **응답 인터셉터**: 401 에러 시 자동으로 토큰 삭제 및 로그인 페이지로 리다이렉트

## 새로운 API 추가하기

1. `src/services/api/` 폴더에 새 파일 생성 (예: `orders.ts`)

```typescript
import apiClient from './client';

export const getOrders = () => apiClient.get('/api/orders');
export const createOrder = (data: any) => apiClient.post('/api/orders', data);
```

2. `index.ts`에 export 추가

```typescript
export * from './orders';
```

3. 컴포넌트에서 사용

```typescript
import { getOrders } from '@/services/api';
```
