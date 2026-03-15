# 고경남 세무사 고객 관리 시스템

세무사를 위한 전문 고객 상담 기록 관리 시스템입니다.

## 🚀 주요 기능

### 📋 핵심 기능
- **고객 관리**: 고객 정보 등록, 수정, 삭제 및 VIP 고객 관리
- **상담 기록**: 날짜별 상담 내용 작성, 리치 텍스트 에디터 지원
- **파일 첨부**: 상담 기록에 파일 첨부 및 관리
- **캘린더 뷰**: 월별 일정 조회 및 예약 관리
- **전역 검색**: 고객명, 상담 내용, 날짜 기준 통합 검색
- **관리자 패널**: 회원 관리 및 시스템 관리

### 🎨 UI/UX
- Apple & Toss 스타일의 고급스러운 디자인
- Glassmorphism 효과
- 반응형 레이아웃 (데스크톱 최적화)
- Pretendard 폰트 적용
- 8px 그리드 시스템

## 📦 기술 스택

### Frontend
- **React 18.3.1** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS v4** - 스타일링
- **Radix UI** - UI 컴포넌트
- **TipTap** - 리치 텍스트 에디터
- **date-fns** - 날짜 처리

### Backend
- **Supabase Edge Functions** - 서버리스 백엔드
- **Hono** - 웹 프레임워크
- **Supabase Storage** - 파일 저장소
- **KV Store** - 데이터베이스
- **bcryptjs** - 비밀번호 해싱
- **Resend** - 이메일 발송

## 🛠️ 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 18 이상
- pnpm (권장) 또는 npm
- Supabase 계정

### 설치 방법

1. **저장소 클론**
```bash
git clone <repository-url>
cd <project-directory>
```

2. **의존성 설치**
```bash
pnpm install
# 또는
npm install
```

3. **환경 변수 설정**

`.env.example` 파일을 참고하여 필요한 환경 변수를 Supabase 프로젝트에 설정하세요.

**필수 환경 변수:**
- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `ADMIN_USERNAME` - 관리자 사용자명
- `ADMIN_PASSWORD_HASH` - 관리자 비밀번호 해시 (bcrypt)
- `RESEND_API_KEY` - Resend API 키
- `RESEND_FROM_EMAIL` - 발신 이메일 주소

4. **관리자 비밀번호 해시 생성**

```bash
# bcryptjs를 사용하여 비밀번호 해시 생성
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password-here', 10));"
```

생성된 해시를 `ADMIN_PASSWORD_HASH` 환경 변수로 설정하세요.

5. **개발 서버 실행**

```bash
pnpm build
# 또는
npm run build
```

## 🔐 보안 가이드

### ⚠️ 중요 보안 사항

1. **비밀번호 관리**
   - 모든 비밀번호는 bcrypt로 해시되어 저장됩니다
   - 비밀번호는 절대 평문으로 저장하지 마세요

2. **관리자 계정**
   - 관리자 자격증명은 환경 변수로만 관리됩니다
   - 프로덕션 환경에서는 강력한 비밀번호를 사용하세요

3. **API 키**
   - 모든 API 키는 환경 변수로 관리됩니다
   - `.env` 파일을 절대 Git에 커밋하지 마세요

4. **파일 업로드**
   - 파일은 Supabase Storage의 private bucket에 저장됩니다
   - 파일 접근은 signed URL로 제한됩니다

## 📂 프로젝트 구조

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx              # 메인 애플리케이션
│   │   ├── components/          # React 컴포넌트
│   │   │   ├── ui/              # 재사용 가능한 UI 컴포넌트
│   │   │   ├── Login.tsx        # 로그인 페이지
│   │   │   ├── ClientList.tsx   # 고객 목록
│   │   │   ├── ClientDetail.tsx # 고객 상세
│   │   │   └── ...
│   │   └── types/
│   │       └── client.ts        # TypeScript 타입 정의
│   └── styles/                  # 스타일 파일
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx        # 백엔드 API 서버
│           └── kv_store.tsx     # KV Store 유틸리티
└── utils/
    └── supabase/
        └── info.tsx             # Supabase 설정
```

## 🔧 주요 컴포넌트

### 인증 (Authentication)
- **로그인/회원가입**: 이메일 인증 지원
- **비밀번호 찾기**: 임시 비밀번호 이메일 발송
- **관리자 패널**: 회원 관리 기능

### 고객 관리 (Client Management)
- **고객 등록**: 이름, 연락처, 이메일, 사업자번호, 업종, 메모
- **VIP 관리**: VIP 고객 표시 및 필터링
- **검색 기능**: 고객명 기반 실시간 검색

### 상담 관리 (Consultation Management)
- **상담 기록**: 날짜, 시간, 내용, 중요도, 색상 라벨
- **리치 에디터**: 텍스트 서식, 링크, 이미지 지원
- **파일 첨부**: 다중 파일 업로드 및 관리
- **예약 관리**: 미래 상담 예약 기능

### 캘린더 (Calendar)
- **월별 뷰**: 상담 및 예약 일정 표시
- **색상 코딩**: 고객별 또는 중요도별 구분
- **빠른 작성**: 캘린더에서 직접 예약 생성

## 🧪 테스트

```bash
# 테스트 실행 (향후 추가 예정)
pnpm test
```

## 🚢 배포

### Supabase Edge Functions 배포

1. **Supabase CLI 설치**
```bash
npm install -g supabase
```

2. **Supabase 로그인**
```bash
supabase login
```

3. **Edge Function 배포**
```bash
supabase functions deploy make-server-9e65d886
```

4. **환경 변수 설정**
```bash
supabase secrets set ADMIN_USERNAME=your-admin-username
supabase secrets set ADMIN_PASSWORD_HASH=your-bcrypt-hash
supabase secrets set RESEND_API_KEY=your-resend-key
# 기타 필요한 환경 변수 설정
```

## 🔒 환경 변수 참조

자세한 환경 변수 설정은 `.env.example` 파일을 참조하세요.

## 📧 이메일 설정

이 프로젝트는 Resend를 사용하여 이메일을 발송합니다.

1. [Resend](https://resend.com)에서 API 키 발급
2. 도메인 인증 설정
3. `RESEND_API_KEY`와 `RESEND_FROM_EMAIL` 환경 변수 설정

## 🤝 기여 가이드

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 사유 라이선스로 보호됩니다.

## 👥 제작

**Developed by Argonautai**

---

## 🐛 알려진 이슈 및 로드맵

### 현재 작업 중
- [ ] 단위 테스트 추가
- [ ] E2E 테스트 구현
- [ ] CI/CD 파이프라인 설정
- [ ] API 서비스 레이어 분리
- [ ] 성능 최적화 (페이지네이션, 캐싱)

### 향후 계획
- [ ] 모바일 앱 지원
- [ ] 알림 기능
- [ ] 보고서 생성 기능
- [ ] 데이터 내보내기/가져오기
- [ ] 다중 세무사 지원

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록하거나 담당자에게 연락주세요.
