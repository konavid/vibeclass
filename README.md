# 바이브클래스 (Vibe Class)

AI와 함께하는 온라인 교육 플랫폼

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **언어**: TypeScript
- **데이터베이스**: MySQL (Prisma ORM)
- **인증**: NextAuth.js (카카오 OAuth, Credentials)
- **스타일링**: Tailwind CSS
- **AI**: Google Gemini API
- **결제**: Payssam API 결제선생 

## 설치

```bash
npm install

# 개발 환경
cp .env.local.example .env.local

# 운영 환경
cp .env.production.local.example .env.production.local
```

## 환경변수 설정

### 환경별 파일

| 파일 | 환경 | 용도 |
|------|------|------|
| `.env.local.example` | 개발 | 개발 환경 설정 템플릿 |
| `.env.production.local.example` | 운영 | 운영 환경 설정 템플릿 |
| `.env.local` | 개발 | 실제 개발 환경 설정 (gitignore) |
| `.env.production.local` | 운영 | 실제 운영 환경 설정 (gitignore) |

### 개발 환경 (`.env.local`)

```env
# 필수
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32 로 생성"

# 사이트 정보
NEXT_PUBLIC_SITE_NAME="내 사이트 이름"
NEXT_PUBLIC_SITE_DESCRIPTION="내 사이트 설명"
NEXT_PUBLIC_CONTACT_EMAIL="contact@example.com"

# 소셜 로그인 (선택)
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""
```

전체 설정 항목은 `.env.local.example` 참조

---

## 첫 번째 가입자 자동 관리자

**첫 번째로 가입하는 사용자는 자동으로 관리자(admin) 권한을 부여받습니다.**

1. 사이트에 처음 접속
2. 카카오 로그인으로 가입
3. 자동으로 관리자 권한 부여
4. `/admin` 페이지에서 관리자 기능 사용 가능

> ⚠️ 두 번째 가입자부터는 일반 사용자(customer)로 가입됩니다.

---

## 카카오 로그인 설정

### 1단계: 카카오 개발자 앱 생성

1. [카카오 개발자](https://developers.kakao.com) 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름, 회사명 입력 후 저장

### 2단계: 플랫폼 설정

1. **앱 설정** → **플랫폼** 메뉴
2. **Web 플랫폼 등록** 클릭
3. 사이트 도메인 입력:
   - 개발: `http://localhost:3000`
   - 운영: `https://your-domain.com`

### 3단계: 카카오 로그인 활성화

1. **제품 설정** → **카카오 로그인** 메뉴
2. **활성화 설정** → ON
3. **Redirect URI** 등록:
   - 개발: `http://localhost:3000/api/auth/callback/kakao`
   - 운영: `https://your-domain.com/api/auth/callback/kakao`

### 4단계: 동의 항목 설정

1. **제품 설정** → **카카오 로그인** → **동의항목**
2. 필수 동의 항목 설정:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의
   - **카카오계정(이메일)**: 선택 동의 (이메일 제공 동의 선택)

### 5단계: 앱 키 확인 및 환경변수 설정

1. **앱 설정** → **앱 키** 메뉴
2. **REST API 키** 복사 → `KAKAO_CLIENT_ID`
3. **제품 설정** → **카카오 로그인** → **보안** → **Client Secret** 생성
4. 생성된 코드 복사 → `KAKAO_CLIENT_SECRET`

```env
# .env.local
KAKAO_CLIENT_ID="발급받은_REST_API_키"
KAKAO_CLIENT_SECRET="발급받은_Client_Secret"
```

### 6단계: 비즈 앱 전환 (운영 시 필수)

1. **앱 설정** → **비즈니스** 메뉴
2. 비즈니스 앱으로 전환 신청
3. 사업자 정보 입력 및 심사 완료

> 💡 비즈 앱 전환 전에는 테스트 사용자만 로그인 가능합니다.

---

## 결제선생 (PaySsam) 설정

[결제선생](https://payssam.kr)은 계좌이체, 카드결제를 지원하는 결제 서비스입니다.

### 1단계: 회원가입 및 가맹점 등록

1. [결제선생](https://payssam.kr) 접속
2. 회원가입 후 가맹점 신청
3. 사업자등록증 등 서류 제출
4. 심사 완료 후 API 키 발급

### 2단계: API 키 확인

가맹점 관리 페이지에서 다음 정보 확인:
- **API Key**: API 인증 키
- **Member ID**: 회원 ID
- **Merchant ID**: 가맹점 ID

### 3단계: 환경변수 설정

```env
# .env.local (개발)
PAYMENT_TEACHER_API_KEY="발급받은_API_KEY"
PAYMENT_TEACHER_MEMBER="회원_ID"
PAYMENT_TEACHER_MERCHANT="가맹점_ID"
PAYMENT_TEACHER_API_URL="https://erp-api.payssam.kr/if/bill/send"
PAYMENT_TEACHER_CHECK_URL="https://erp-api.payssam.kr/if/bill/check"
PAYMENT_CALLBACK_URL="http://localhost:3000/api/payment/callback"
```

```env
# .env.production.local (운영)
PAYMENT_TEACHER_API_KEY="운영용_API_KEY"
PAYMENT_TEACHER_MEMBER="회원_ID"
PAYMENT_TEACHER_MERCHANT="가맹점_ID"
PAYMENT_TEACHER_API_URL="https://erp-api.payssam.kr/if/bill/send"
PAYMENT_TEACHER_CHECK_URL="https://erp-api.payssam.kr/if/bill/check"
PAYMENT_CALLBACK_URL="https://your-domain.com/api/payment/callback"
```

### 4단계: 콜백 URL 등록

결제선생 관리자 페이지에서 콜백 URL 등록:
- 개발: `http://localhost:3000/api/payment/callback`
- 운영: `https://your-domain.com/api/payment/callback`

### 결제 흐름

```
1. 사용자가 강의 수강신청
2. /api/payment/request → 결제선생 API 호출 → 결제 링크 생성
3. 사용자가 결제 링크에서 결제 완료
4. 결제선생 → /api/payment/callback 호출
5. 수강 등록 완료
```

### 결제 관련 파일

| 파일 | 설명 |
|------|------|
| `lib/payssam.ts` | 결제선생 API 클라이언트 |
| `lib/payment-utils.ts` | 결제 유틸리티 함수 |
| `app/api/payment/request/route.ts` | 결제 요청 API |
| `app/api/payment/callback/route.ts` | 결제 완료 콜백 |
| `app/api/payment/status/[billId]/route.ts` | 결제 상태 조회 |
---

## 데이터베이스

```bash
npx prisma migrate dev
npx prisma db seed
```

## 실행

```bash
npm run dev
```

## 배포

자세한 내용은 `DEPLOYMENT.md` 참조

```bash
npm run build
pm2 start npm --name "app" -- start
```

---

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── admin/             # 관리자 페이지
│   ├── instructor/        # 강사 페이지
│   ├── my/                # 사용자 마이페이지
│   └── ...                # 공개 페이지
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 및 설정
├── prisma/                # 데이터베이스 스키마
└── public/                # 정적 파일
```

---

## 핵심 파일 위치

### 설정 파일

| 파일 | 설명 |
|------|------|
| `lib/config.ts` | 사이트 설정 (이름, URL, 텍스트 등) |
| `lib/auth.ts` | NextAuth 인증 설정 |
| `lib/prisma.ts` | Prisma 클라이언트 |
| `lib/security.ts` | 보안 유틸리티 (인증, 검증, XSS 방지) |
| `prisma/schema.prisma` | 데이터베이스 스키마 |
| `.env.local.example` | 환경변수 예시 |

### 서비스 라이브러리

| 파일 | 설명 |
|------|------|
| `lib/gemini.ts` | Google Gemini AI API 클라이언트 |
| `lib/email.ts` | 이메일 발송 (SMTP, SES) |
| `lib/sms.ts` | SMS 발송 |
| `lib/kakao-alimtalk.ts` | 카카오 알림톡 발송 |
| `lib/notification.ts` | 통합 알림 서비스 |
| `lib/payssam.ts` | Payssam 결제 연동 |
| `lib/payment-utils.ts` | 결제 유틸리티 |

### 레이아웃 컴포넌트

| 파일 | 설명 |
|------|------|
| `components/admin/AdminLayout.tsx` | 관리자 레이아웃 |
| `components/instructor/InstructorLayout.tsx` | 강사 레이아웃 |
| `components/customer/CustomerLayout.tsx` | 사용자 레이아웃 |
| `components/customer/Header.tsx` | 헤더 컴포넌트 |
| `components/customer/Footer.tsx` | 푸터 컴포넌트 |

### 주요 UI 컴포넌트

| 파일 | 설명 |
|------|------|
| `components/ui/Button.tsx` | 버튼 컴포넌트 |
| `components/ui/Input.tsx` | 입력 컴포넌트 |
| `components/ui/Card.tsx` | 카드 컴포넌트 |
| `components/ui/RichTextEditor.tsx` | 리치 텍스트 에디터 |
| `components/auth/LoginModal.tsx` | 로그인 모달 |

### 주요 페이지

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `app/page.tsx` | 메인 페이지 |
| `/courses` | `app/courses/page.tsx` | 강의 목록 |
| `/courses/[id]` | `app/courses/[id]/page.tsx` | 강의 상세 |
| `/login` | `app/login/page.tsx` | 로그인 |
| `/register` | `app/register/page.tsx` | 회원가입 |
| `/admin` | `app/admin/page.tsx` | 관리자 대시보드 |
| `/instructor` | `app/instructor/page.tsx` | 강사 대시보드 |

### 주요 API 라우트

| 경로 | 파일 | 설명 |
|------|------|------|
| `/api/auth/[...nextauth]` | `app/api/auth/[...nextauth]/route.ts` | 인증 API |
| `/api/courses` | `app/api/courses/route.ts` | 강의 목록 API |
| `/api/payment/enroll` | `app/api/payment/enroll/route.ts` | 수강신청 API |
| `/api/upload` | `app/api/upload/route.ts` | 파일 업로드 API |
| `/api/admin/*` | `app/api/admin/*` | 관리자 API |
| `/api/instructor/*` | `app/api/instructor/*` | 강사 API |

---

## 커스터마이징

### 사이트 정보 변경

환경변수 또는 `lib/config.ts` 수정:

```typescript
// lib/config.ts
export const siteConfig = {
  name: '사이트 이름',
  description: '사이트 설명',
  // ...
}
```

### 텍스트 변경

`lib/config.ts`의 `textConfig` 수정:

```typescript
export const textConfig = {
  hero: {
    title: '히어로 제목',
    subtitle: '히어로 부제목',
  },
  // ...
}
```

### 네비게이션 메뉴 수정

- 관리자: `components/admin/AdminLayout.tsx`
- 강사: `components/instructor/InstructorLayout.tsx`
- 사용자: `components/customer/Header.tsx`

---

## 보안

### 인증 및 권한

- 미들웨어 기반 라우트 보호: `middleware.ts`
- API 권한 검증: `lib/security.ts`

```typescript
// API에서 권한 검증 사용 예시
import { requireAdmin, requireAuth } from '@/lib/security'

export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error
  // ...
}
```

### 보안 유틸리티

- `requireAuth()` - 로그인 필수
- `requireAdmin()` - 관리자 권한 필수
- `requireInstructor()` - 강사 권한 필수
- `sanitizeHtml()` - XSS 방지
- `sanitizeFileName()` - 파일명 안전 처리
- `validateEmail()`, `validatePhone()` - 입력 검증

---

## AI 기능

Gemini API를 사용한 AI 기능 (`lib/gemini.ts`):

- 강의 커리큘럼 자동 생성
- 강의 설명 자동 생성
- 프로모션 이미지 생성 (Imagen-3)
- 썸네일 이미지 생성

```typescript
import { generateText, generateImage } from '@/lib/gemini'

// 텍스트 생성
const text = await generateText({ prompt: '...' })

// 이미지 생성
const imageBase64 = await generateImage({ prompt: '...', aspectRatio: '16:9' })
```

---

## 라이선스

MIT
