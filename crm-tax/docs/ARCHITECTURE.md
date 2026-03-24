# 시스템 아키텍처 문서

> **프로젝트**: 세무사 고객 상담 관리 시스템  
> **작성일**: 2026-01-12  
> **버전**: 1.0.0

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 기능](#핵심-기능)
5. [인증 시스템](#인증-시스템)
6. [데이터 흐름](#데이터-흐름)
7. [UI/UX 디자인](#uiux-디자인)
8. [배포 환경](#배포-환경)

---

## 시스템 개요

### 목적
세무사가 고객 정보를 관리하고 상담 내역을 체계적으로 기록할 수 있는 웹 기반 관리 시스템

### 주요 기능
- 👥 **고객 관리**: 고객 정보 등록/수정/삭제
- 📝 **상담 기록**: 날짜별 상담 내용 작성 및 조회
- 📅 **캘린더 뷰**: 월별 상담 일정 시각화
- 🔍 **통합 검색**: 고객명, 상담 내용 전체 검색
- 📎 **파일 첨부**: 상담 관련 문서 업로드
- ✨ **Rich Text**: 구글닥스 수준의 서식 편집
- 🔐 **멀티테넌트**: 사용자별 완전한 데이터 격리

---

## 기술 스택

### Frontend
```
React 18.3.1          - UI 프레임워크
TypeScript 5.6.2      - 타입 안전성
Tailwind CSS 4.0      - 스타일링
Lucide React          - 아이콘
Sonner                - 토스트 알림
```

### Backend
```
Supabase Edge Functions  - 서버리스 백엔드
Deno Runtime             - JavaScript/TypeScript 런타임
Hono 4.x                 - 웹 프레임워크
```

### Database & Storage
```
PostgreSQL (Supabase)    - 데이터베이스
KV Store Pattern         - NoSQL 스타일 데이터 저장
Supabase Storage         - 파일 저장소
```

### Authentication
```
Custom Auth System       - 자체 인증 시스템
PBKDF2                   - 비밀번호 해싱
Web Crypto API           - 암호화 알고리즘
```

### Email Service
```
Resend API               - 이메일 발송 (비밀번호 재설정)
```

---

## 프로젝트 구조

```
/
├── src/
│   ├── app/
│   │   ├── components/           # React 컴포넌트
│   │   │   ├── ui/               # 공통 UI 컴포넌트
│   │   │   ├── Login.tsx         # 로그인 화면
│   │   │   ├── SignUp.tsx        # 회원가입 화면
│   │   │   ├── CalendarView.tsx  # 캘린더 뷰
│   │   │   ├── ClientList.tsx    # 고객 목록
│   │   │   ├── ClientDetail.tsx  # 고객 상세
│   │   │   ├── ConsultationFormNew.tsx  # 상담 기록 작성
│   │   │   └── ...
│   │   ├── types/                # TypeScript 타입 정의
│   │   │   └── client.ts         # Client, Consultation 타입
│   │   ├── utils/                # 유틸리티 함수
│   │   │   └── api.ts            # API 호출 헬퍼
│   │   └── App.tsx               # 메인 앱 컴포넌트
│   └── styles/
│       ├── theme.css             # 디자인 토큰
│       └── fonts.css             # 폰트 import
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx         # 메인 서버 파일
│           ├── kv_store.tsx      # KV Store 인터페이스 (보호됨)
│           ├── crypto.tsx        # 암호화 유틸리티
│           ├── validation.tsx    # 입력 검증
│           └── logger.tsx        # 로깅 유틸리티
│
├── docs/                         # 문서
│   ├── DATABASE_STRUCTURE.md    # DB 구조 문서
│   └── ARCHITECTURE.md          # 이 문서
│
└── DATA_ISOLATION_TEST_GUIDE.md  # 데이터 격리 테스트 가이드
```

---

## 핵심 기능

### 1. 고객 관리 (Client Management)

#### 기능 목록
- ✅ 고객 등록 (이름, 연락처, 이메일, 사업자번호, 업종, 메모)
- ✅ 고객 정보 수정
- ✅ 고객 삭제 (상담 기록 포함)
- ✅ VIP 고객 표시
- ✅ 고객 검색

#### 화면 구조
```
고객 목록 (ClientList)
  ↓ 고객 선택
고객 상세 (ClientDetail)
  ├─ 고객 정보 표시
  ├─ 상담 기록 목록 (타임라인)
  └─ 신규 상담 작성 버튼
```

### 2. 상담 기록 (Consultation Management)

#### 기능 목록
- ✅ 날짜/시간 지정
- ✅ Rich Text 편집 (굵게, 기울임, 밑줄, 목록, 링크 등)
- ✅ 파일 첨부 (이미지, PDF, 문서)
- ✅ 중요 표시
- ✅ 캘린더 색상 지정
- ✅ 상담 예약 (미래 날짜)

#### 데이터 구조
```typescript
interface Consultation {
  id: string;
  userId: string;              // 작성자
  clientId: string;            // 고객 ID
  date: string;                // 상담 날짜
  time?: string;               // 상담 시간
  content: string;             // HTML 형식 내용
  status?: 'scheduled';        // 예약 상태
  isImportant?: boolean;       // 중요 표시
  color?: string;              // 색상
  attachments?: Attachment[];  // 첨부파일
  createdAt: string;
  updatedAt: string;
}
```

### 3. 캘린더 뷰 (Calendar View)

#### 특징
- 📅 월별 캘린더 UI
- 🔵 날짜별 상담 건수 표시
- 🎨 색상별 상담 구분
- ➕ 날짜 클릭 시 신규 상담/예약 등록
- 📊 월 통계 (총 상담 건수, 예약 건수)

#### 구현 방식
```typescript
// 날짜별 상담 그룹화
const consultationsByDate = consultations.reduce((acc, consultation) => {
  const date = consultation.date;
  if (!acc[date]) acc[date] = [];
  acc[date].push(consultation);
  return acc;
}, {});
```

### 4. 검색 시스템 (Search)

#### 검색 대상
- 고객명
- 고객 전화번호
- 고객 이메일
- 상담 내용 (HTML 태그 제거 후)

#### 실시간 검색
```typescript
const filteredClients = clients.filter(client => 
  client.name.toLowerCase().includes(query.toLowerCase()) ||
  client.phone?.includes(query) ||
  client.email?.toLowerCase().includes(query.toLowerCase())
);

const filteredConsultations = consultations.filter(consultation => {
  const textContent = consultation.content.replace(/<[^>]*>/g, '');
  return textContent.toLowerCase().includes(query.toLowerCase());
});
```

### 5. 파일 첨부 시스템 (File Attachments)

#### 지원 형식
- 📄 문서: PDF, DOCX, XLSX, PPTX
- 🖼️ 이미지: JPG, PNG, GIF, WebP
- 📦 기타: ZIP, TXT

#### 제한사항
- 최대 파일 크기: 50MB
- 버킷: `make-9e65d886-consultations` (Private)

#### 파일 URL
```typescript
// Signed URL (7일 유효)
const { data } = await supabase.storage
  .from(BUCKET_NAME)
  .createSignedUrl(filePath, 604800); // 7 days
```

---

## 인증 시스템

### 1. 회원가입 (Sign Up)

#### 프로세스
```
1. 사용자 정보 입력 (username, email, password)
   ↓
2. 이메일 중복 확인
   ↓
3. 비밀번호 해싱 (PBKDF2 + Salt)
   ↓
4. KV Store 저장 (user:{username})
   ↓
5. 회원가입 완료 → 로그인 화면 이동
```

#### PBKDF2 암호화
```typescript
// Salt 생성
const salt = crypto.randomUUID();

// 비밀번호 해싱
const encoder = new TextEncoder();
const keyMaterial = await crypto.subtle.importKey(
  'raw',
  encoder.encode(password),
  { name: 'PBKDF2' },
  false,
  ['deriveBits']
);

const derivedBits = await crypto.subtle.deriveBits(
  {
    name: 'PBKDF2',
    salt: encoder.encode(salt),
    iterations: 100000,
    hash: 'SHA-256'
  },
  keyMaterial,
  256
);

const hashArray = Array.from(new Uint8Array(derivedBits));
const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### 2. 로그인 (Login)

#### 프로세스
```
1. username, password 입력
   ↓
2. KV Store에서 사용자 조회
   ↓
3. 저장된 salt로 입력 비밀번호 해싱
   ↓
4. 해시 비교
   ↓
5. 일치 시:
   - localStorage.setItem('isAuthenticated', 'true')
   - localStorage.setItem('username', username)
   ↓
6. 메인 화면 이동
```

### 3. 비밀번호 찾기 (Forgot Password)

#### 프로세스
```
1. 이메일 입력
   ↓
2. 사용자 존재 확인
   ↓
3. 임시 비밀번호 생성
   ↓
4. Resend API로 이메일 발송
   ↓
5. 비밀번호 해시 업데이트
```

#### 이메일 템플릿
```javascript
{
  from: 'baeby@argonautai.co.kr',
  to: userEmail,
  subject: '[세무사 관리 시스템] 임시 비밀번호 발급',
  html: `
    <p>임시 비밀번호: <strong>${tempPassword}</strong></p>
    <p>로그인 후 비밀번호를 변경해주세요.</p>
  `
}
```

### 4. 관리자 계정 (Admin)

#### 관리자 전용 기능
- 👥 전체 사용자 목록 조회
- 🗑️ 사용자 삭제

#### 관리자 계정 정보
```
Username: adminqoquddbs
Password: qoquddbs870628
```

---

## 데이터 흐름

### 예시: 새 상담 기록 작성

```
┌─────────────────────────────────────────────────────┐
│  1. 사용자: "김철수" 고객 상세 화면에서              │
│     "상담 기록 작성" 버튼 클릭                       │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  2. React: ConsultationFormNew 컴포넌트 렌더링       │
│     - Rich Text Editor 초기화                        │
│     - 파일 업로드 UI 준비                            │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  3. 사용자: 상담 내용 입력 + 파일 첨부               │
│     - 날짜: 2026-01-15                               │
│     - 시간: 14:30                                    │
│     - 내용: "<p>종합소득세 관련...</p>"              │
│     - 첨부: 계약서.pdf                               │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  4. 프론트엔드: handleCreateConsultation 호출        │
│     const response = await fetchWithAuth(            │
│       '/clients/:clientId/consultations',            │
│       {                                              │
│         method: 'POST',                              │
│         body: JSON.stringify(data)                   │
│       }                                              │
│     );                                               │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  5. API 요청 헤더:                                   │
│     Authorization: Bearer <publicAnonKey>            │
│     X-User-ID: testuser123                           │
│     Content-Type: application/json                   │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  6. 서버: X-User-ID 추출 및 검증                     │
│     const userId = c.req.header('X-User-ID');        │
│     if (!userId) return 401;                         │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  7. 서버: 상담 기록 생성                             │
│     const id = crypto.randomUUID();                  │
│     const key = `consultation:${userId}:${clientId}:${id}`; │
│     await kv.set(key, consultationData);             │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  8. 서버: 파일 업로드 (있는 경우)                    │
│     const filePath = `${userId}/${clientId}/${id}/${fileId}`; │
│     await supabase.storage.from(BUCKET_NAME).upload(filePath, file); │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  9. 서버: Signed URL 생성                            │
│     const { data } = await supabase.storage          │
│       .from(BUCKET_NAME)                             │
│       .createSignedUrl(filePath, 604800);            │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  10. 서버: 응답 반환                                 │
│      { consultation: { id, userId, ... } }           │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  11. 프론트엔드: State 업데이트                      │
│      setConsultations(prev => [...prev, newConsultation]); │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  12. React: 화면 리렌더링                            │
│      - 상담 기록 목록에 새 항목 추가                 │
│      - 성공 토스트 표시                              │
└─────────────────────────────────────────────────────┘
```

---

## UI/UX 디자인

### 디자인 시스템

#### 컬러 팔레트
```css
/* Toss Blue - Primary Color */
--color-primary: #3182F6;

/* Grayscale */
--color-background: #FAFAFA;
--color-foreground: #1A1A1A;
--color-muted: #6B7280;

/* Semantic Colors */
--color-success: #10B981;
--color-error: #EF4444;
--color-warning: #F59E0B;
```

#### 타이포그래피
```css
/* Font Family */
font-family: 'Pretendard', -apple-system, sans-serif;

/* Font Sizes */
--font-xs: 0.75rem;    /* 12px */
--font-sm: 0.875rem;   /* 14px */
--font-base: 1rem;     /* 16px */
--font-lg: 1.125rem;   /* 18px */
--font-xl: 1.25rem;    /* 20px */
--font-2xl: 1.5rem;    /* 24px */
```

#### 간격 (Spacing)
```css
/* Tailwind Default Scale */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
```

### 디자인 원칙

#### 1. Apple Style - Minimalism
- 깔끔한 여백
- 얇은 선 (border: 1px)
- 부드러운 그림자
- 최소한의 색상 사용

#### 2. Glassmorphism
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

#### 3. Micro Interactions
- Hover 시 살짝 확대 (`scale-105`)
- 부드러운 전환 (`transition-all duration-200`)
- 클릭 시 눌리는 효과 (`active:scale-95`)

#### 4. Responsive Design
```css
/* Mobile First */
.container {
  padding: 1rem;  /* Mobile */
}

@media (min-width: 768px) {
  .container {
    padding: 2.5rem;  /* Desktop */
  }
}
```

---

## 배포 환경

### Supabase 프로젝트 정보

**Project ID**: `qahbdisdgaqngzatmxiq`

**API URL**: `https://qahbdisdgaqngzatmxiq.supabase.co`

### 환경 변수

```bash
# Supabase
SUPABASE_URL=https://qahbdisdgaqngzatmxiq.supabase.co
SUPABASE_ANON_KEY=<public_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_DB_URL=<database_url>

# Email
RESEND_API_KEY=re_DfhRHq1v_dkBzZX73ZNJKwLhhf5U58BnT
RESEND_FROM_EMAIL=baeby@argonautai.co.kr
```

### Edge Function 배포

```bash
# 서버 함수 배포
supabase functions deploy server

# 로그 확인
supabase functions logs server
```

### 프론트엔드 빌드

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

---

## 모니터링 및 로깅

### 서버 로그

```typescript
// 로그 레벨
console.log('[INFO] Normal operation');
console.error('[ERROR] Something went wrong');

// 구조화된 로그
console.log('[API] POST /clients', {
  userId: 'testuser123',
  timestamp: new Date().toISOString()
});
```

### 클라이언트 에러 트래킹

```typescript
// 전역 에러 핸들러
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error);
  toast.error('오류가 발생했습니다.');
});
```

---

## 성능 최적화

### 1. 코드 스플리팅
```typescript
// React.lazy로 컴포넌트 지연 로딩
const CalendarView = lazy(() => import('./components/CalendarView'));
```

### 2. 메모이제이션
```typescript
// 고비용 계산 캐싱
const consultationsByDate = useMemo(() => {
  return consultations.reduce((acc, c) => {
    // ...
  }, {});
}, [consultations]);
```

### 3. 이미지 최적화
- Signed URL 7일간 유효 → 재사용
- 이미지 리사이징은 클라이언트 측에서 처리

### 4. API 요청 최적화
```typescript
// 병렬 요청
const [clients, consultations] = await Promise.all([
  fetchWithAuth('/clients'),
  fetchWithAuth('/consultations')
]);
```

---

## 보안 체크리스트

- [x] 비밀번호 PBKDF2 해싱
- [x] Salt 랜덤 생성
- [x] 사용자별 데이터 격리
- [x] X-User-ID 헤더 검증
- [x] Private Storage 버킷
- [x] Signed URL (7일 제한)
- [x] 서버 측 입력 검증
- [ ] Rate Limiting (TODO)
- [ ] CSRF Protection (TODO)
- [ ] XSS Prevention (기본 React 보호)

---

## 향후 개선 사항

### 단기 (1-2개월)
- [ ] 비밀번호 변경 기능
- [ ] 사용자 프로필 설정
- [ ] 상담 템플릿 기능
- [ ] Excel 내보내기

### 중기 (3-6개월)
- [ ] 모바일 앱 (React Native)
- [ ] 알림 시스템 (예약 알림)
- [ ] 통계 대시보드
- [ ] 다국어 지원

### 장기 (6개월+)
- [ ] AI 상담 요약
- [ ] 음성 녹음 기능
- [ ] 고객 포털 (고객이 직접 조회)
- [ ] 팀 협업 기능

---

## 관련 문서

- [데이터베이스 구조](/docs/DATABASE_STRUCTURE.md)
- [데이터 격리 테스트](/DATA_ISOLATION_TEST_GUIDE.md)

---

**문서 버전**: 1.0.0  
**최종 수정**: 2026-01-12  
**작성자**: Figma Make AI Assistant
