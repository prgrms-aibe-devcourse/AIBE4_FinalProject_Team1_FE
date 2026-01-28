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

<br>

## 팀 협업 컨벤션
### 커밋 메시지 유형

| 유형 | 의미 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 formatting, 세미콜론 누락 등 |
| `refactor` | 코드 리팩토링 |
| `test` | 테스트 코드 추가 |
| `chore` | 패키지 매니저 수정, 기타 수정 |
| `design` | CSS 등 UI 디자인 변경 |
| `comment` | 주석 추가 및 변경 |
| `rename` | 파일/폴더명 수정 또는 이동 |
| `remove` | 파일 삭제 |
| `!breaking change` | 커다란 API 변경 |
| `!hotfix` | 급한 버그 수정 |
| `assets` | 에셋 파일 추가 |

### 커밋 메시지 형식

**제목:**
```
type : 커밋메시지
```

**내용:**
```markdown
### 작업 내용
- 작업 내용 1
- 작업 내용 2
- 작업 내용 3
```
