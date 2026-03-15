# 데이터베이스 다이어그램

> 시각적으로 이해하는 DB 구조

---

## 🗂️ KV Store 키 계층 구조

```
kv_store_9e65d886 (PostgreSQL Table)
│
├── user:adminqoquddbs
│   ├─ username: "adminqoquddbs"
│   ├─ email: "admin@example.com"
│   ├─ passwordHash: "..."
│   └─ createdAt: "2026-01-01T00:00:00Z"
│
├── user:testuser123
│   ├─ username: "testuser123"
│   ├─ email: "test@example.com"
│   └─ ...
│
├── client:testuser123:550e8400-e29b-41d4-a716-446655440000
│   ├─ id: "550e8400-e29b-41d4-a716-446655440000"
│   ├─ userId: "testuser123"
│   ├─ name: "김철수"
│   ├─ phone: "010-1234-5678"
│   └─ ...
│
├── client:testuser123:7c9e6679-7425-40de-944b-e07fc1f90ae7
│   ├─ id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
│   ├─ userId: "testuser123"
│   ├─ name: "이영희"
│   └─ ...
│
├── client:anotheruser:abc123...
│   └─ ... (다른 사용자의 고객, testuser123은 접근 불가!)
│
├── consultation:testuser123:550e8400...:a1b2c3d4-e5f6-7890-abcd-ef1234567890
│   ├─ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
│   ├─ userId: "testuser123"
│   ├─ clientId: "550e8400-e29b-41d4-a716-446655440000"
│   ├─ date: "2026-01-15"
│   ├─ content: "<p>상담 내용...</p>"
│   └─ attachments: [...]
│
└── consultation:testuser123:550e8400...:9f8e7d6c-5b4a-3210-fedc-ba0987654321
    └─ ...
```

---

## 🔗 엔티티 관계도 (ERD)

```
┌─────────────────┐
│      User       │
│─────────────────│
│ username (PK)   │◄──────────┐
│ email           │           │
│ passwordHash    │           │
│ salt            │           │ 1
│ createdAt       │           │
└─────────────────┘           │
                              │
                              │
                              │ N
┌─────────────────┐           │
│     Client      │           │
│─────────────────│           │
│ id (PK)         │           │
│ userId (FK)     │───────────┘
│ name            │
│ phone           │           1
│ email           │           │
│ businessNumber  │           │
│ industry        │           │
│ memo            │           │
│ isVip           │           │
│ createdAt       │           │
│ updatedAt       │           │
└─────────────────┘           │
        ▲                     │
        │                     │
        │ 1                   │
        │                     │
        │ N                   │ N
┌─────────────────┐           │
│  Consultation   │           │
│─────────────────│           │
│ id (PK)         │           │
│ userId (FK)     │───────────┘
│ clientId (FK)   │───────────┘
│ date            │
│ time            │           1
│ content         │           │
│ status          │           │
│ isImportant     │           │
│ color           │           │
│ createdAt       │           │
│ updatedAt       │           │
└─────────────────┘           │
        │                     │
        │                     │ N
        │                     │
        │ 1:N                 ▼
        │           ┌─────────────────┐
        └───────────│   Attachment    │
                    │─────────────────│
                    │ id              │
                    │ fileName        │
                    │ fileSize        │
                    │ fileType        │
                    │ url (Signed)    │
                    │ uploadedAt      │
                    └─────────────────┘
```

**관계 설명**:
- User : Client = 1 : N (한 사용자는 여러 고객 보유)
- User : Consultation = 1 : N (한 사용자는 여러 상담 기록 보유)
- Client : Consultation = 1 : N (한 고객은 여러 상담 기록 보유)
- Consultation : Attachment = 1 : N (한 상담에 여러 파일 첨부 가능)

---

## 🗄️ Supabase Storage 구조

```
make-9e65d886-consultations (Private Bucket)
│
├── testuser123/                           ← 사용자별 폴더
│   ├── 550e8400-e29b-41d4-a716-446655440000/  ← 고객별 폴더
│   │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  ← 상담별 폴더
│   │   │   ├── file-123-abc.pdf
│   │   │   ├── file-456-def.jpg
│   │   │   └── file-789-ghi.docx
│   │   │
│   │   └── 9f8e7d6c-5b4a-3210-fedc-ba0987654321/
│   │       └── file-xyz.pdf
│   │
│   └── 7c9e6679-7425-40de-944b-e07fc1f90ae7/
│       └── ...
│
└── anotheruser/                           ← 다른 사용자 (완전 격리)
    └── ...
```

**경로 패턴**:
```
{userId}/{clientId}/{consultationId}/{attachmentId}
```

**예시**:
```
testuser123/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/file-123-abc.pdf
```

---

## 🔐 데이터 격리 시각화

### 사용자별 데이터 파티셔닝

```
┌──────────────────────────────────────────────────────────┐
│                    KV Store Database                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Partition: testuser123                    │         │
│  ├────────────────────────────────────────────┤         │
│  │  user:testuser123                          │         │
│  │  client:testuser123:*                      │         │
│  │  consultation:testuser123:*                │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Partition: anotheruser                    │         │
│  ├────────────────────────────────────────────┤         │
│  │  user:anotheruser                          │         │
│  │  client:anotheruser:*                      │         │
│  │  consultation:anotheruser:*                │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Partition: adminqoquddbs                  │         │
│  ├────────────────────────────────────────────┤         │
│  │  user:adminqoquddbs                        │         │
│  │  client:adminqoquddbs:*                    │         │
│  │  consultation:adminqoquddbs:*              │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘

🔒 각 파티션은 완전히 독립적!
🔒 X-User-ID 헤더로 파티션 접근 제어
```

---

## 📊 데이터 조회 패턴

### Pattern 1: 특정 사용자의 모든 고객 조회

```sql
-- Conceptual (실제는 KV Store의 getByPrefix)
SELECT * FROM kv_store_9e65d886
WHERE key LIKE 'client:testuser123:%'
```

**결과**:
```
client:testuser123:550e8400-e29b-41d4-a716-446655440000
client:testuser123:7c9e6679-7425-40de-944b-e07fc1f90ae7
client:testuser123:abc-123-def-456-...
...
```

### Pattern 2: 특정 고객의 모든 상담 조회

```sql
SELECT * FROM kv_store_9e65d886
WHERE key LIKE 'consultation:testuser123:550e8400-e29b-41d4-a716-446655440000:%'
```

**결과**:
```
consultation:testuser123:550e8400...:a1b2c3d4-e5f6-7890-abcd-ef1234567890
consultation:testuser123:550e8400...:9f8e7d6c-5b4a-3210-fedc-ba0987654321
...
```

### Pattern 3: 특정 사용자의 모든 상담 조회 (전체 고객)

```sql
SELECT * FROM kv_store_9e65d886
WHERE key LIKE 'consultation:testuser123:%'
```

**결과**: testuser123이 작성한 모든 상담 기록

---

## 🔄 데이터 생명주기

### 1. 신규 고객 등록

```
[Frontend]
  ↓ POST /clients
[Server]
  ↓ userId = c.req.header('X-User-ID')  // "testuser123"
  ↓ id = crypto.randomUUID()             // "550e8400-..."
  ↓ key = `client:${userId}:${id}`       // "client:testuser123:550e8400-..."
  ↓
[KV Store]
  ↓ kv.set(key, clientData)
  ✅ 저장 완료
```

### 2. 상담 기록 작성

```
[Frontend]
  ↓ POST /clients/:clientId/consultations
[Server]
  ↓ userId = c.req.header('X-User-ID')  // "testuser123"
  ↓ clientId = c.req.param('clientId')   // "550e8400-..."
  ↓ id = crypto.randomUUID()             // "a1b2c3d4-..."
  ↓ key = `consultation:${userId}:${clientId}:${id}`
  ↓
[KV Store]
  ↓ kv.set(key, consultationData)
  ↓
[Storage] (파일 첨부 시)
  ↓ filePath = `${userId}/${clientId}/${id}/${fileId}`
  ↓ supabase.storage.from(BUCKET_NAME).upload(filePath, file)
  ✅ 저장 완료
```

### 3. 고객 삭제 (Cascade)

```
[Frontend]
  ↓ DELETE /clients/:clientId
[Server]
  ↓ userId = c.req.header('X-User-ID')
  ↓ clientKey = `client:${userId}:${clientId}`
  ↓
[KV Store]
  ↓ kv.del(clientKey)  // 고객 삭제
  ↓
  ↓ consultations = kv.getByPrefix(`consultation:${userId}:${clientId}:`)
  ↓ for each consultation:
  ↓   ├─ kv.del(`consultation:${userId}:${clientId}:${consultationId}`)
  ↓   └─ storage.remove(`${userId}/${clientId}/${consultationId}/*`)
  ✅ 모두 삭제 완료 (Cascade)
```

---

## 📈 스케일링 고려사항

### 현재 구조 (KV Store)

**장점**:
- ✅ 유연한 스키마
- ✅ 빠른 개발 속도
- ✅ prefix 검색으로 효율적 조회

**제한사항**:
- ⚠️ 복잡한 조인 불가
- ⚠️ 인덱싱 제한적
- ⚠️ 대용량 데이터(10만+ 레코드) 시 성능 저하 가능

### 향후 확장 시 고려사항

**100+ 사용자, 10,000+ 고객 도달 시**:

Option 1: **PostgreSQL 정규화**
```sql
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  ...
);

CREATE TABLE clients (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(username),
  name TEXT,
  ...
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
```

Option 2: **Partitioning**
```sql
CREATE TABLE consultations (
  id UUID,
  user_id TEXT,
  ...
) PARTITION BY LIST (user_id);

CREATE TABLE consultations_user1 PARTITION OF consultations
  FOR VALUES IN ('user1');
```

---

## 🎨 다이어그램 범례

```
┌─────────────────┐
│   엔티티/테이블   │   데이터 객체
│─────────────────│
│ 필드1 (PK)      │   Primary Key
│ 필드2 (FK)      │   Foreign Key
│ 필드3           │   일반 필드
└─────────────────┘

◄────  1:1 관계 (One-to-One)
◄──── 1:N 관계 (One-to-Many)
◄──── N:M 관계 (Many-to-Many)
```

---

**작성일**: 2026-01-12  
**버전**: 1.0.0
