# 프로젝트 구조

```
app/                    # Next.js App Router
├── api/               # API 라우트
├── admin/             # 관리자 페이지
├── instructor/        # 강사 페이지
├── my/                # 마이페이지
└── ...                # 공개 페이지
components/            # React 컴포넌트
lib/                   # 유틸리티 및 설정
prisma/                # DB 스키마
public/                # 정적 파일
```

## 핵심 파일

### 설정
- `lib/config.ts` - 사이트 설정
- `lib/auth.ts` - NextAuth 설정
- `lib/prisma.ts` - Prisma 클라이언트
- `lib/security.ts` - 보안 유틸리티

### 서비스
- `lib/gemini.ts` - Gemini AI API
- `lib/email.ts` - 이메일 발송
- `lib/sms.ts` - SMS 발송
- `lib/kakao-alimtalk.ts` - 알림톡
- `lib/payssam.ts` - 결제

### 레이아웃
- `components/admin/AdminLayout.tsx`
- `components/instructor/InstructorLayout.tsx`
- `components/customer/CustomerLayout.tsx`
- `components/customer/Header.tsx`
- `components/customer/Footer.tsx`

## 커스터마이징

사이트 정보: `lib/config.ts`의 `siteConfig`
텍스트: `lib/config.ts`의 `textConfig`
메뉴: 각 레이아웃 컴포넌트
