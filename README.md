# AIBE4 Final Project - Frontend

React + TypeScript + Vite 기반 프론트엔드 애플리케이션

---

## Local Run

### 사전 준비

- Node.js 18+ 설치

---

### Run

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버 실행 후 아래 URL로 접속할 수 있습니다.

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |

---

### Build

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## With Docker (BE 연동)

백엔드와 함께 실행하려면 BE 레포에서 Docker Compose를 사용하세요.

```
Workspace/
├── AIBE4_FinalProject_Team1_BE
└── AIBE4_FinalProject_Team1_FE
```

```bash
# BE 레포에서 실행
cd ../AIBE4_FinalProject_Team1_BE
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Web App | http://localhost |
| Swagger UI | http://localhost/api/swagger-ui/index.html |
