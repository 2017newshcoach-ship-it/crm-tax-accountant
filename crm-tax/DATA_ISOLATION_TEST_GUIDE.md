# 데이터 격리 테스트 가이드

## 🧪 테스트 시나리오

### 준비사항
1. **브라우저 완전 새로고침**: Ctrl+Shift+R 또는 Cmd+Shift+R
2. **Console 탭 열기**: F12 → Console

---

## 테스트 1: 사용자 A 데이터 생성

### Step 1: 회원가입 & 로그인
1. 회원가입 버튼 클릭
2. 정보 입력:
   - **Username**: `testuser_a`
   - **Email**: `user_a@test.com`
   - **Password**: `password123`
3. 회원가입 완료 후 로그인

### Step 2: 데이터 생성
1. **고객 생성**:
   - 고객명: `김철수 (사용자A의 고객)`
   - 전화번호: `010-1111-1111`
   
2. **상담 기록 작성**:
   - 날짜: `2025-01-15`
   - 내용: `사용자A의 상담 내용입니다.`

### Step 3: Console 확인
```javascript
// Console에 입력
localStorage.getItem('username')
// 결과: "testuser_a"
```

### Step 4: 로그아웃
- 로그아웃 버튼 클릭

---

## 테스트 2: 사용자 B 데이터 생성

### Step 1: 회원가입 & 로그인
1. 회원가입 버튼 클릭
2. 정보 입력:
   - **Username**: `testuser_b`
   - **Email**: `user_b@test.com`
   - **Password**: `password123`
3. 회원가입 완료 후 로그인

### Step 2: 화면 확인
**✅ 예상 결과**:
- 고객 목록이 **비어있음**
- "김철수 (사용자A의 고객)" 보이지 **않음**

### Step 3: 데이터 생성
1. **고객 생성**:
   - 고객명: `이영희 (사용자B의 고객)`
   - 전화번호: `010-2222-2222`
   
2. **상담 기록 작성**:
   - 날짜: `2025-01-15`
   - 내용: `사용자B의 상담 내용입니다.`

### Step 4: Console 확인
```javascript
// Console에 입력
localStorage.getItem('username')
// 결과: "testuser_b"
```

---

## 테스트 3: 교차 검증

### Step 1: 사용자 B 화면 확인
**✅ 예상 결과**:
- 고객 목록에 "이영희" **만** 표시
- "김철수" 보이지 **않음**

### Step 2: 로그아웃 → 사용자 A로 재로그인
1. 로그아웃
2. 사용자 A 계정으로 로그인:
   - Username: `testuser_a`
   - Password: `password123`

### Step 3: 사용자 A 화면 확인
**✅ 예상 결과**:
- 고객 목록에 "김철수" **만** 표시
- "이영희" 보이지 **않음**
- 상담 내용: "사용자A의 상담 내용입니다."만 표시

---

## 테스트 4: Network 요청 확인

### Step 1: Network 탭 열기
- F12 → Network 탭

### Step 2: 고객 목록 조회 요청 확인
1. 페이지 새로고침
2. `GET /clients` 요청 선택
3. **Headers** 탭에서 확인:

```
X-User-ID: testuser_a  ← 사용자 식별 헤더 확인!
Authorization: Bearer <publicAnonKey>
```

### Step 3: Response 확인
```json
{
  "clients": [
    {
      "id": "...",
      "userId": "testuser_a",  ← 사용자 ID 필드 확인!
      "name": "김철수 (사용자A의 고객)",
      ...
    }
  ]
}
```

---

## ✅ 테스트 통과 기준

### 1. 데이터 격리
- [ ] 사용자 A는 자신의 데이터만 조회
- [ ] 사용자 B는 자신의 데이터만 조회
- [ ] 다른 사용자의 데이터가 보이지 않음

### 2. API 인증
- [ ] 모든 요청에 `X-User-ID` 헤더 포함
- [ ] `userId` 필드가 데이터에 저장됨

### 3. KV Store 구조
서버 로그에서 확인 (개발자 도구 - Console):
```
client:testuser_a:abc-123
client:testuser_b:def-456
consultation:testuser_a:abc-123:xyz-789
consultation:testuser_b:def-456:uvw-012
```

---

## 🔴 실패 시나리오 (발생하면 안 됨!)

### ❌ 데이터 누출
- 사용자 A가 사용자 B의 고객/상담을 볼 수 있음
- 검색 기능에서 다른 사용자 데이터가 나타남

### ❌ API 오류
- 401 Unauthorized 에러 발생
- `X-User-ID` 헤더가 전송되지 않음
- 데이터 생성/수정 실패

---

## 📊 관리자 계정 테스트

### 관리자 로그인
- **Username**: `adminqoquddbs`
- **Password**: `qoquddbs870628`

**Note**: 관리자 계정은 별도 Admin 패널을 사용하며, 일반 사용자 데이터와 분리됨

---

## 🎉 성공적인 테스트 결과

모든 체크리스트 항목이 ✅이면 **데이터 격리가 완벽하게 구현됨**!

각 사용자는:
- ✅ 자신의 고객만 관리 가능
- ✅ 자신의 상담 기록만 조회 가능
- ✅ 다른 사용자의 데이터에 접근 불가능
- ✅ 완전히 독립적인 작업 공간 보유

---

**마지막 업데이트**: 2026-01-12
