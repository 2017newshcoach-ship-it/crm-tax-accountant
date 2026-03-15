# 📚 세무사 고객 상담 관리 시스템 - 문서

> 이 폴더에는 시스템의 기술 문서가 포함되어 있습니다.

---

## 📖 문서 목록

### 1. [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)
**데이터베이스 구조 완벽 가이드**

데이터베이스의 모든 것을 알고 싶다면 이 문서를 참조하세요.

**포함 내용**:
- ✅ KV Store 키 구조 (`user:`, `client:`, `consultation:`)
- ✅ 데이터 스키마 (User, Client, Consultation, Attachment)
- ✅ Supabase Storage 구조
- ✅ 데이터 격리 메커니즘
- ✅ API 엔드포인트 전체 목록
- ✅ 마이그레이션 가이드
- ✅ 문제 해결 (Troubleshooting)

**읽어야 할 사람**:
- 백엔드 개발자
- 데이터베이스 관리자
- 시스템 아키텍트

---

### 2. [ARCHITECTURE.md](./ARCHITECTURE.md)
**시스템 아키텍처 설계 문서**

전체 시스템의 큰 그림을 이해하고 싶다면 이 문서를 참조하세요.

**포함 내용**:
- ✅ 시스템 개요 및 목적
- ✅ 기술 스택 상세
- ✅ 프로젝트 구조
- ✅ 핵심 기능 설명
- ✅ 인증 시스템 (PBKDF2, 회원가입, 로그인)
- ✅ 데이터 흐름 다이어그램
- ✅ UI/UX 디자인 시스템
- ✅ 배포 환경
- ✅ 성능 최적화 전략

**읽어야 할 사람**:
- 프론트엔드 개발자
- 백엔드 개발자
- 프로젝트 매니저
- 신규 팀원 (온보딩용)

---

## 🧪 테스트 문서

### [DATA_ISOLATION_TEST_GUIDE.md](../DATA_ISOLATION_TEST_GUIDE.md)
**데이터 격리 QA 가이드**

사용자별 데이터 격리가 제대로 작동하는지 테스트하는 방법을 담은 문서입니다.

**포함 내용**:
- ✅ 단계별 테스트 시나리오
- ✅ 예상 결과 (Pass/Fail 기준)
- ✅ Network 요청 검증 방법
- ✅ 체크리스트

**읽어야 할 사람**:
- QA 엔지니어
- 개발자 (자체 테스트용)

---

## 🗂️ 문서 구조

```
docs/
├── README.md                  ← 이 문서 (문서 인덱스)
├── DATABASE_STRUCTURE.md      ← DB 구조 상세
└── ARCHITECTURE.md            ← 시스템 아키텍처

../ (프로젝트 루트)
└── DATA_ISOLATION_TEST_GUIDE.md  ← 데이터 격리 테스트
```

---

## 📋 빠른 참조 (Quick Reference)

### 시스템 핵심 정보

| 항목 | 값 |
|------|-----|
| **프로젝트명** | 세무사 고객 상담 관리 시스템 |
| **기술 스택** | React + TypeScript + Supabase |
| **데이터베이스** | PostgreSQL (KV Store) |
| **스토리지** | Supabase Storage |
| **인증 방식** | Custom (PBKDF2) |
| **배포 환경** | Supabase Edge Functions |

### 주요 관리자 정보

| 역할 | Username | 비고 |
|------|----------|------|
| **관리자** | `adminqoquddbs` | 사용자 관리 권한 |
| **일반 사용자** | 회원가입 필요 | 독립적인 데이터 공간 |

### 중요 URL

| 서비스 | URL |
|--------|-----|
| **Supabase Dashboard** | https://supabase.com/dashboard/project/qahbdisdgaqngzatmxiq |
| **API Base URL** | https://qahbdisdgaqngzatmxiq.supabase.co/functions/v1/make-server-9e65d886 |
| **Database** | https://supabase.com/dashboard/project/qahbdisdgaqngzatmxiq/database/tables |
| **Storage** | https://supabase.com/dashboard/project/qahbdisdgaqngzatmxiq/storage/buckets |

---

## 🚀 시작하기

### 새 개발자 온보딩 순서

1. **[ARCHITECTURE.md](./ARCHITECTURE.md) 읽기**
   - 시스템 전체 구조 파악
   - 기술 스택 이해
   - 핵심 기능 학습

2. **[DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) 읽기**
   - 데이터 모델 이해
   - KV Store 키 구조 학습
   - API 엔드포인트 숙지

3. **[DATA_ISOLATION_TEST_GUIDE.md](../DATA_ISOLATION_TEST_GUIDE.md)로 테스트**
   - 실제 시스템 동작 확인
   - 데이터 격리 메커니즘 체험

4. **코드 베이스 탐색**
   - `/src/app/App.tsx` - 메인 애플리케이션
   - `/src/app/components/` - UI 컴포넌트
   - `/supabase/functions/server/index.tsx` - 백엔드 API

---

## 🔄 문서 업데이트 가이드

### 문서 수정 시 주의사항

1. **버전 관리**
   - 각 문서 하단에 "최종 수정" 날짜 업데이트
   - 주요 변경사항은 문서 내 변경 이력 섹션에 기록

2. **일관성 유지**
   - 용어는 일관되게 사용 (예: "고객" vs "클라이언트")
   - 코드 예시는 실제 코드와 동기화

3. **다른 문서와 연동**
   - 관련 문서 간 링크 확인
   - 변경사항이 다른 문서에 영향을 주는지 검토

---

## 📞 문의 및 기여

### 문서 관련 문의
문서에 오류가 있거나 개선이 필요한 부분이 있다면:
1. 이슈 생성
2. 수정 사항 제안
3. Pull Request 제출

### 기여 가이드라인
- 명확하고 간결하게 작성
- 코드 예시는 실행 가능한 것으로
- 스크린샷 추가 시 민감 정보 제거

---

## 📝 문서 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-01-12 | 1.0.0 | 초기 문서 작성 | AI Assistant |
| - | - | - | - |

---

**마지막 업데이트**: 2026-01-12  
**문서 관리자**: Figma Make Team
