# 데이터베이스 구조 문서

> **작성일**: 2026-01-12  
> **프로젝트**: 세무사 고객 상담 관리 시스템  
> **DB 종류**: Supabase KV Store (PostgreSQL JSONB) + Supabase Storage

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [KV Store 구조](#kv-store-구조)
4. [데이터 스키마](#데이터-스키마)
5. [Storage 구조](#storage-구조)
6. [데이터 격리 메커니즘](#데이터-격리-메커니즘)
7. [API 엔드포인트](#api-엔드포인트)
8. [마이그레이션 가이드](#마이그레이션-가이드)

---

## 시스템 개요

### 핵심 특징
- **멀티테넌트**: 각 사용자는 완전히 독립된 데이터 공간 보유
- **데이터 격리**: 사용자 ID 기반 키 구조로 완벽한 격리 보장
- **NoSQL 스타일**: KV Store를 활용한 유연한 데이터 모델
- **파일 저장소**: Supabase Storage로 첨부파일 관리

### 기술 스택
```
Frontend    → React + TypeScript
Backend     → Supabase Edge Functions (Deno + Hono)
Database    → PostgreSQL (KV Store 테이블)
Storage     → Supabase Storage
Auth        → Custom (PBKDF2 기반)
```

---

## 아키텍처

### 3-Tier Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  - API 호출 시 X-User-ID 헤더 자동 전송            │
│  - localStorage에서 username 읽기                   │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS + X-User-ID Header
                 ↓
┌─────────────────────────────────────────────────────┐
│          Server (Supabase Edge Function)            │
│  - Hono Web Framework                               │
│  - X-User-ID 헤더로 사용자 식별                     │
│  - 모든 데이터 접근 시 userId 검증                 │
└────────────────┬────────────────────────────────────┘
                 │ SQL + Storage API
                 ↓
┌─────────────────────────────────────────────────────┐
│         Database (PostgreSQL + Storage)             │
│  - kv_store_9e65d886 테이블 (KV Store)             │
│  - make-9e65d886-consultations 버킷 (Storage)      │
└─────────────────────────────────────────────────────┘
```

---

## KV Store 구조

### 테이블 스키마

```sql
CREATE TABLE kv_store_9e65d886 (
  key   TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

### 키 네이밍 컨벤션

모든 키는 **콜론(:)으로 구분된 계층 구조**를 사용합니다.

#### 1. 사용자 (User)
```
user:{username}
```

**예시**:
```
user:adminqoquddbs
user:testuser123
```

#### 2. 고객 (Client)
```
client:{userId}:{clientId}
```

**예시**:
```
client:testuser123:550e8400-e29b-41d4-a716-446655440000
client:adminqoquddbs:7c9e6679-7425-40de-944b-e07fc1f90ae7
```

**특징**:
- `{userId}`: 고객을 소유한 세무사의 username
- `{clientId}`: UUID v4 형식의 고유 식별자
- 각 세무사는 자신의 고객만 조회 가능

#### 3. 상담 기록 (Consultation)
```
consultation:{userId}:{clientId}:{consultationId}
```

**예시**:
```
consultation:testuser123:550e8400-e29b-41d4-a716-446655440000:a1b2c3d4-e5f6-7890-abcd-ef1234567890
consultation:adminqoquddbs:7c9e6679-7425-40de-944b-e07fc1f90ae7:9f8e7d6c-5b4a-3210-fedc-ba0987654321
```

**특징**:
- `{userId}`: 상담 기록을 작성한 세무사의 username
- `{clientId}`: 상담 대상 고객의 ID
- `{consultationId}`: UUID v4 형식의 상담 기록 ID
- 고객 삭제 시 해당 고객의 모든 상담 기록도 함께 삭제

---

## 데이터 스키마

### User (사용자)

```typescript
interface User {
  username: string;      // 로그인 ID (Primary Key)
  email: string;         // 이메일 (비밀번호 찾기용)
  passwordHash: string;  // PBKDF2 해시
  salt: string;          // 암호화 Salt
  createdAt: string;     // ISO 8601 타임스탬프
}
```

**저장 위치**: `user:{username}`

**예시 데이터**:
```json
{
  "username": "testuser123",
  "email": "test@example.com",
  "passwordHash": "a1b2c3d4...",
  "salt": "random_salt_value",
  "createdAt": "2026-01-12T10:30:00.000Z"
}
```

---

### Client (고객)

```typescript
interface Client {
  id: string;              // UUID v4
  userId: string;          // 소유자 사용자 ID
  name: string;            // 고객명 (필수)
  phone?: string;          // 전화번호
  email?: string;          // 이메일
  businessNumber?: string; // 사업자등록번호
  industry?: string;       // 업종
  memo?: string;           // 메모
  isVip?: boolean;         // VIP 여부
  createdAt: string;       // 생성일시 (ISO 8601)
  updatedAt: string;       // 수정일시 (ISO 8601)
}
```

**저장 위치**: `client:{userId}:{id}`

**예시 데이터**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "testuser123",
  "name": "김철수",
  "phone": "010-1234-5678",
  "email": "kim@example.com",
  "businessNumber": "123-45-67890",
  "industry": "제조업",
  "memo": "주요 고객",
  "isVip": true,
  "createdAt": "2026-01-12T10:30:00.000Z",
  "updatedAt": "2026-01-12T14:20:00.000Z"
}
```

**인덱싱 전략**:
- `getByPrefix("client:{userId}:")` → 특정 사용자의 모든 고객 조회
- 고객명 검색은 애플리케이션 레벨에서 처리

---

### Consultation (상담 기록)

```typescript
interface Consultation {
  id: string;              // UUID v4
  userId: string;          // 소유자 사용자 ID
  clientId: string;        // 고객 ID (FK)
  date: string;            // 상담 날짜 (YYYY-MM-DD)
  time?: string;           // 상담 시간 (HH:mm)
  content: string;         // 상담 내용 (Rich Text HTML)
  status?: 'scheduled';    // 상태 (scheduled: 예약, 미지정: 완료)
  isImportant?: boolean;   // 중요 표시
  color?: string;          // 캘린더 색상 (blue, green, red, etc.)
  attachments?: Attachment[]; // 첨부파일 배열
  createdAt: string;       // 생성일시 (ISO 8601)
  updatedAt: string;       // 수정일시 (ISO 8601)
}
```

**저장 위치**: `consultation:{userId}:{clientId}:{id}`

**예시 데이터**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "testuser123",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-01-15",
  "time": "14:30",
  "content": "<p>종합소득세 신고 관련 상담...</p>",
  "status": undefined,
  "isImportant": true,
  "color": "blue",
  "attachments": [
    {
      "id": "file-123",
      "fileName": "계약서.pdf",
      "fileSize": 1024000,
      "fileType": "application/pdf",
      "url": "https://...signedUrl...",
      "uploadedAt": "2026-01-15T14:35:00.000Z"
    }
  ],
  "createdAt": "2026-01-15T14:30:00.000Z",
  "updatedAt": "2026-01-15T14:35:00.000Z"
}
```

**인덱싱 전략**:
- `getByPrefix("consultation:{userId}:")` → 특정 사용자의 모든 상담 조회
- `getByPrefix("consultation:{userId}:{clientId}:")` → 특정 고객의 상담 조회

---

### Attachment (첨부파일)

```typescript
interface Attachment {
  id: string;         // UUID v4 (파일명으로 사용)
  fileName: string;   // 원본 파일명
  fileSize: number;   // 파일 크기 (bytes)
  fileType: string;   // MIME Type
  url: string;        // Signed URL (7일 유효)
  uploadedAt: string; // 업로드 시간 (ISO 8601)
}
```

**특징**:
- Consultation의 `attachments` 배열에 메타데이터 저장
- 실제 파일은 Supabase Storage에 저장
- Signed URL은 7일간 유효하며, 조회 시마다 재생성

---

## Storage 구조

### 버킷 정보

**버킷명**: `make-9e65d886-consultations`

**설정**:
```javascript
{
  public: false,           // Private 버킷 (인증 필요)
  fileSizeLimit: 52428800  // 50MB 제한
}
```

### 파일 경로 구조

```
make-9e65d886-consultations/
└── {userId}/
    └── {clientId}/
        └── {consultationId}/
            └── {attachmentId}
```

**예시**:
```
make-9e65d886-consultations/
└── testuser123/
    └── 550e8400-e29b-41d4-a716-446655440000/
        └── a1b2c3d4-e5f6-7890-abcd-ef1234567890/
            ├── file-123-abc.pdf
            ├── file-456-def.jpg
            └── file-789-ghi.docx
```

**특징**:
- 사용자별 폴더로 격리
- 상담 기록 삭제 시 해당 폴��의 모든 파일 자동 삭제
- Private 버킷이므로 Signed URL로만 접근 가능

---

## 데이터 격리 메커니즘

### 1. 키 기반 격리

모든 데이터 키에 `{userId}` 포함:
```
client:testuser123:abc-123     ← testuser123 소유
client:anotheruser:abc-123     ← anotheruser 소유 (완전히 다른 데이터)
```

### 2. API 레벨 인증

모든 API 요청에 `X-User-ID` 헤더 필수:
```javascript
// 프론트엔드
const headers = {
  'Authorization': 'Bearer <publicAnonKey>',
  'X-User-ID': localStorage.getItem('username')
};

// 서버
function getUsernameFromAuth(c: any): string | null {
  const userId = c.req.header('X-User-ID');
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
```

### 3. Prefix 검색 활용

```javascript
// 특정 사용자의 모든 고객 조회
const clients = await kv.getByPrefix(`client:${userId}:`);

// 특정 사용자의 특정 고객 상담 조회
const consultations = await kv.getByPrefix(`consultation:${userId}:${clientId}:`);

// 다른 사용자의 데이터는 절대 조회되지 않음!
```

### 4. Storage 경로 격리

파일 업로드/다운로드 시 userId 확인:
```javascript
const filePath = `${userId}/${clientId}/${consultationId}/${attachmentId}`;
await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
```

---

## API 엔드포인트

### 인증 (Authentication)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|-----------|
| POST | `/signup` | 회원가입 | ❌ |
| POST | `/login` | 로그인 | ❌ |
| POST | `/forgot-password` | 비밀번호 재설정 이메일 발송 | ❌ |

### 고객 (Clients)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|-----------|
| GET | `/clients` | 내 고객 목록 조회 | ✅ |
| GET | `/clients/:id` | 고객 상세 조회 | ✅ |
| POST | `/clients` | 고객 생성 | ✅ |
| PUT | `/clients/:id` | 고객 수정 | ✅ |
| DELETE | `/clients/:id` | 고객 삭제 (상담 기록 포함) | ✅ |

### 상담 기록 (Consultations)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|-----------|
| GET | `/consultations` | 내 모든 상담 기록 조회 | ✅ |
| GET | `/clients/:clientId/consultations` | 특정 고객 상담 기록 조회 | ✅ |
| POST | `/clients/:clientId/consultations` | 상담 기록 생성 | ✅ |
| PUT | `/clients/:clientId/consultations/:id` | 상담 기록 수정 | ✅ |
| PATCH | `/clients/:clientId/consultations/:id/important` | 중요 표시 토글 | ✅ |
| DELETE | `/clients/:clientId/consultations/:id` | 상담 기록 삭제 | ✅ |

### 첨부파일 (Attachments)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|-----------|
| POST | `/clients/:clientId/consultations/:consultationId/attachments` | 파일 업로드 | ✅ |
| DELETE | `/clients/:clientId/consultations/:consultationId/attachments/:attachmentId` | 파일 삭제 | ✅ |

---

## 마이그레이션 가이드

### 기존 데이터를 새 구조로 마이그레이션

만약 기존에 `userId` 없이 데이터가 저장된 경우:

```javascript
// 1. 모든 기존 고객 조회
const oldClients = await kv.getByPrefix("client:");

// 2. 각 고객에 userId 추가 및 새 키로 저장
for (const client of oldClients) {
  const userId = "adminqoquddbs"; // 기존 데이터의 소유자 지정
  const newKey = `client:${userId}:${client.id}`;
  const newClient = { ...client, userId };
  
  await kv.set(newKey, newClient);
  await kv.del(`client:${client.id}`); // 기존 키 삭제
}

// 3. 상담 기록도 동일하게 처리
const oldConsultations = await kv.getByPrefix("consultation:");

for (const consultation of oldConsultations) {
  const userId = "adminqoquddbs";
  const newKey = `consultation:${userId}:${consultation.clientId}:${consultation.id}`;
  const newConsultation = { ...consultation, userId };
  
  await kv.set(newKey, newConsultation);
  await kv.del(`consultation:${consultation.id}`);
}
```

**⚠️ 주의**: 실제 마이그레이션 전 반드시 백업 수행!

---

## 데이터 흐름 예시

### 시나리오: 새 상담 기록 작성

```
1. 사용자 "testuser123" 로그인
   └─ localStorage.setItem('username', 'testuser123')

2. 고객 "김철수" 선택
   └─ clientId: "550e8400-e29b-41d4-a716-446655440000"

3. 상담 기록 작성 버튼 클릭

4. 프론트엔드 → 서버 API 호출
   POST /clients/550e8400-.../consultations
   Headers: {
     X-User-ID: "testuser123"
   }
   Body: {
     date: "2026-01-15",
     time: "14:30",
     content: "<p>상담 내용...</p>"
   }

5. 서버에서 userId 추출 및 검증
   const userId = c.req.header('X-User-ID'); // "testuser123"

6. 새 상담 기록 생성
   const id = crypto.randomUUID();
   const key = `consultation:testuser123:550e8400-...:${id}`;
   await kv.set(key, consultationData);

7. 응답 반환
   { "consultation": { id, userId, clientId, ... } }
```

---

## 보안 고려사항

### ✅ 구현된 보안 기능

1. **사용자별 데이터 격리**
   - 키 구조에 userId 포함으로 완벽한 격리

2. **인증 헤더 검증**
   - 모든 API 요청에서 X-User-ID 필수 확인

3. **비밀번호 암호화**
   - PBKDF2 알고리즘 사용
   - Salt 랜덤 생성

4. **Private Storage**
   - Signed URL로만 파일 접근 가능 (7일 유효)

5. **입력 검증**
   - 서버 측에서 모든 입력 데이터 검증

### ⚠️ 추가 권장사항

1. **Rate Limiting**: API 호출 횟수 제한
2. **HTTPS Only**: 모든 통신 암호화
3. **Session Management**: 로그인 세션 타임아웃 설정
4. **Audit Logging**: 민감한 작업 로그 기록

---

## 성능 최적화

### 1. Prefix 검색 최적화

```javascript
// ❌ 비효율적: 모든 데이터 조회 후 필터링
const allData = await kv.getByPrefix("");
const myData = allData.filter(d => d.userId === userId);

// ✅ 효율적: Prefix로 바로 필터링
const myData = await kv.getByPrefix(`client:${userId}:`);
```

### 2. 병렬 조회

```javascript
// ✅ 클라이언트와 상담 기록 동시 조회
const [clients, consultations] = await Promise.all([
  kv.getByPrefix(`client:${userId}:`),
  kv.getByPrefix(`consultation:${userId}:`)
]);
```

### 3. Signed URL 캐싱

Signed URL은 7일간 유효하므로 클라이언트 측에서 캐싱 가능

---

## 백업 전략

### 권장 백업 방법

```javascript
// 전체 데이터 백업
async function backupAllData() {
  const supabase = createClient(...);
  
  // KV Store 전체 데이터
  const { data: kvData } = await supabase
    .from("kv_store_9e65d886")
    .select("*");
  
  // Storage 파일 목록
  const { data: files } = await supabase.storage
    .from("make-9e65d886-consultations")
    .list();
  
  return {
    timestamp: new Date().toISOString(),
    kvStore: kvData,
    files: files
  };
}
```

**백업 주기**: 일일 자동 백업 권장

---

## 문제 해결 (Troubleshooting)

### Q: 다른 사용자의 데이터가 보입니다

**A**: X-User-ID 헤더 확인
```javascript
// 개발자 도구 → Network → 요청 선택 → Headers 탭
X-User-ID: your_username  // 이 헤더가 있는지 확인
```

### Q: 파일 업로드 실패

**A**: 버킷 권한 및 파일 크기 확인
- 버킷이 생성되었는지 확인
- 파일 크기 50MB 이하인지 확인
- userId가 올바른지 확인

### Q: 상담 기록 삭제 후 파일이 남아있음

**A**: Storage 삭제 로직 확인
```javascript
// 상담 삭제 시 파일도 함께 삭제되는지 확인
const filePaths = consultation.attachments.map(att => 
  `${userId}/${clientId}/${consultationId}/${att.id}`
);
await supabase.storage.from(BUCKET_NAME).remove(filePaths);
```

---

## 관련 문서

- [API 문서](/docs/API.md) - 상세 API 스펙 (TODO)
- [보안 가이드](/docs/SECURITY.md) - 보안 정책 (TODO)
- [데이터 격리 테스트](/DATA_ISOLATION_TEST_GUIDE.md) - QA 가이드

---

**문서 버전**: 1.0.0  
**최종 수정**: 2026-01-12  
**작성자**: Figma Make AI Assistant
