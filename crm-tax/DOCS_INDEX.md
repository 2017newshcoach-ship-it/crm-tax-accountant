# 📚 프로젝트 문서 인덱스

> **세무사 고객 상담 관리 시스템** - 전체 문서 가이드

---

## 🗺️ 문서 지도

```
프로젝트 문서
│
├── 📘 시스템 이해하기
│   ├── [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
│   │   └── 시스템 전체 아키텍처, 기술 스택, 핵심 기능
│   │
│   └── [DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md)
│       └── DB 구조, 데이터 스키마, API 엔드포인트
│
└── 🧪 테스트 및 QA
    └── [DATA_ISOLATION_TEST_GUIDE.md](./DATA_ISOLATION_TEST_GUIDE.md)
        └── 사용자별 데이터 격리 테스트 가이드
```

---

## 🎯 역할별 추천 문서

### 👨‍💻 백엔드 개발자
1. **필독**: [DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md)
   - KV Store 키 구조
   - API 엔드포인트 전체 목록
   - 데이터 격리 메커니즘

2. **권장**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - 인증 시스템 (PBKDF2)
   - 데이터 흐름
   - 배포 환경

### 🎨 프론트엔드 개발자
1. **필독**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - React 컴포넌트 구조
   - UI/UX 디자인 시스템
   - API 통신 방법

2. **권장**: [DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md)
   - 데이터 스키마 (TypeScript 타입)
   - API 엔드포인트 목록

### 🧪 QA 엔지니어
1. **필독**: [DATA_ISOLATION_TEST_GUIDE.md](./DATA_ISOLATION_TEST_GUIDE.md)
   - 단계별 테스트 시나리오
   - 체크리스트

2. **권장**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - 핵심 기능 목록
   - 인증 시스템

### 📊 프로젝트 매니저
1. **필독**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - 시스템 개요
   - 핵심 기능
   - 향후 개선 사항

### 🆕 신규 팀원 (온보딩)
**순서대로 읽기**:
1. [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - 시스템 전체 이해
2. [DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md) - 데이터 구조 학습
3. [DATA_ISOLATION_TEST_GUIDE.md](./DATA_ISOLATION_TEST_GUIDE.md) - 실습 테스트

---

## 📖 문서 상세 설명

### 1️⃣ ARCHITECTURE.md
**시스템 아키텍처 설계 문서**

| 섹션 | 내용 | 용도 |
|------|------|------|
| 시스템 개요 | 프로젝트 목적, 주요 기능 | 프로젝트 이해 |
| 기술 스택 | React, Supabase, Deno 등 | 기술 선정 이유 |
| 프로젝트 구조 | 폴더 구조, 파일 역할 | 코드 탐색 |
| 핵심 기능 | 고객 관리, 상담 기록, 캘린더 등 | 기능 명세 |
| 인증 시스템 | 회원가입, 로그인, PBKDF2 | 보안 구현 |
| 데이터 흐름 | API 요청/응답 흐름도 | 통신 구조 |
| UI/UX 디자인 | 디자인 토큰, 컬러, 타이포그래피 | 디자인 시스템 |
| 배포 환경 | Supabase 설정, 환경변수 | 배포 가이드 |

📄 **총 페이지**: ~50줄 (20분 독서)  
🔗 **링크**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

### 2️⃣ DATABASE_STRUCTURE.md
**데이터베이스 구조 완벽 가이드**

| 섹션 | 내용 | 용도 |
|------|------|------|
| KV Store 구조 | 키 네이밍 컨벤션 | 데이터 저장 방법 |
| 데이터 스키마 | User, Client, Consultation 타입 | 데이터 모델 |
| Storage 구조 | 파일 저장 경로, Signed URL | 파일 관리 |
| 데이터 격리 | 사용자별 데이터 분리 메커니즘 | 보안 구현 |
| API 엔드포인트 | 전체 API 목록 (GET, POST, PUT 등) | API 개발 |
| 마이그레이션 | 기존 데이터 변환 스크립트 | 데이터 이전 |
| 문제 해결 | FAQ, Troubleshooting | 디버깅 |

📄 **총 페이지**: ~60줄 (25분 독서)  
🔗 **링크**: [DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md)

---

### 3️⃣ DATA_ISOLATION_TEST_GUIDE.md
**데이터 격리 QA 테스트 가이드**

| 섹션 | 내용 | 용도 |
|------|------|------|
| 테스트 시나리오 | 사용자 A/B 데이터 격리 확인 | QA 테스트 |
| 단계별 가이드 | 회원가입 → 데이터 생성 → 검증 | 실습 |
| 체크리스트 | Pass/Fail 기준 | 품질 검증 |
| Network 검증 | X-User-ID 헤더 확인 | 기술 검증 |
| 관리자 테스트 | Admin 계정 별도 테스트 | 권한 검증 |

📄 **총 페이지**: ~30줄 (15분 독서 + 30분 실습)  
🔗 **링크**: [DATA_ISOLATION_TEST_GUIDE.md](./DATA_ISOLATION_TEST_GUIDE.md)

---

## 🔍 주제별 빠른 검색

### 데이터베이스 관련
- **KV Store 키 구조**: [DATABASE_STRUCTURE.md § KV Store 구조](./docs/DATABASE_STRUCTURE.md#kv-store-구조)
- **데이터 스키마**: [DATABASE_STRUCTURE.md § 데이터 스키마](./docs/DATABASE_STRUCTURE.md#데이터-스키마)
- **Storage 파일 경로**: [DATABASE_STRUCTURE.md § Storage 구조](./docs/DATABASE_STRUCTURE.md#storage-구조)

### API 개발
- **API 엔드포인트 목록**: [DATABASE_STRUCTURE.md § API 엔드포인트](./docs/DATABASE_STRUCTURE.md#api-엔드포인트)
- **인증 헤더**: [ARCHITECTURE.md § 데이터 흐름](./docs/ARCHITECTURE.md#데이터-흐름)
- **에러 처리**: [ARCHITECTURE.md § 모니터링 및 로깅](./docs/ARCHITECTURE.md#모니터링-및-로깅)

### 프론트엔드
- **컴포넌트 구조**: [ARCHITECTURE.md § 프로젝트 구조](./docs/ARCHITECTURE.md#프로젝트-구조)
- **디자인 시스템**: [ARCHITECTURE.md § UI/UX 디자인](./docs/ARCHITECTURE.md#uiux-디자인)
- **State 관리**: [ARCHITECTURE.md § 핵심 기능](./docs/ARCHITECTURE.md#핵심-기능)

### 보안
- **인증 시스템**: [ARCHITECTURE.md § 인증 시스템](./docs/ARCHITECTURE.md#인증-시스템)
- **데이터 격리**: [DATABASE_STRUCTURE.md § 데이터 격리 메커니즘](./docs/DATABASE_STRUCTURE.md#데이터-격리-메커니즘)
- **비밀번호 암호화**: [ARCHITECTURE.md § 인증 시스템 § PBKDF2](./docs/ARCHITECTURE.md#1-회원가입-sign-up)

### 배포
- **환경 변수**: [ARCHITECTURE.md § 배포 환경](./docs/ARCHITECTURE.md#배포-환경)
- **Edge Functions**: [ARCHITECTURE.md § 배포 환경](./docs/ARCHITECTURE.md#edge-function-배포)

---

## 📊 문서 메트릭스

| 문서 | 분량 | 독서 시간 | 난이도 | 업데이트 빈도 |
|------|------|-----------|--------|--------------|
| ARCHITECTURE.md | 중 (~400줄) | 30분 | ⭐⭐⭐ | 월 1회 |
| DATABASE_STRUCTURE.md | 대 (~500줄) | 40분 | ⭐⭐⭐⭐ | 분기 1회 |
| DATA_ISOLATION_TEST_GUIDE.md | 소 (~200줄) | 15분 + 실습 | ⭐⭐ | 필요 시 |

---

## 🚀 빠른 시작 (Quick Start)

### 5분 만에 시스템 이해하기

1. **[ARCHITECTURE.md - 시스템 개요](./docs/ARCHITECTURE.md#시스템-개요)** (3분)
   - 프로젝트가 무엇인지 파악

2. **[DATABASE_STRUCTURE.md - 데이터 흐름 예시](./docs/DATABASE_STRUCTURE.md#데이터-흐름-예시)** (2분)
   - 실제 동작 방식 이해

### 1시간 만에 개발 준비 완료

1. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md) 전체 읽기** (30분)
2. **[DATABASE_STRUCTURE.md - KV Store & 스키마](./docs/DATABASE_STRUCTURE.md)** (20분)
3. **[DATA_ISOLATION_TEST_GUIDE.md](./DATA_ISOLATION_TEST_GUIDE.md) 실습** (10분)

---

## 🔧 문서 유지보수

### 문서 업데이트 체크리스트

코드 변경 시 아래 항목을 확인하세요:

- [ ] **API 엔드포인트 추가/변경** → DATABASE_STRUCTURE.md 업데이트
- [ ] **데이터 스키마 변경** → DATABASE_STRUCTURE.md + ARCHITECTURE.md 업데이트
- [ ] **새 기능 추가** → ARCHITECTURE.md § 핵심 기능 업데이트
- [ ] **인증 로직 변경** → ARCHITECTURE.md § 인증 시스템 업데이트
- [ ] **UI 디자인 변경** → ARCHITECTURE.md § UI/UX 디자인 업데이트

### 문서 품질 기준

✅ **좋은 문서**:
- 코드 예시가 실제로 실행 가능
- 스크린샷에 민감 정보 없음
- 타 문서와 링크로 연결됨
- 최종 수정일이 명시됨

❌ **나쁜 문서**:
- 오래된 정보 (코드와 불일치)
- 링크 깨짐
- 설명 없는 코드
- 가정(assumption)만 있고 근거 없음

---

## 📞 도움이 필요하신가요?

### 문서 관련 질문
- 이슈 생성: GitHub Issues
- 직접 수정: Pull Request

### 기술 지원
- 데이터베이스 문제: [DATABASE_STRUCTURE.md § 문제 해결](./docs/DATABASE_STRUCTURE.md#문제-해결-troubleshooting)
- 배포 문제: [ARCHITECTURE.md § 배포 환경](./docs/ARCHITECTURE.md#배포-환경)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-01-12 | 1.0.0 | 문서 인덱스 초기 작성 |

---

**마지막 업데이트**: 2026-01-12  
**관리 팀**: Figma Make Development Team
