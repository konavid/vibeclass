# 보안

## 인증 및 권한

- 미들웨어: `middleware.ts`
- API 권한: `lib/security.ts`

## 권한 검증 사용법

```typescript
import { requireAdmin, requireAuth } from '@/lib/security'

export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error
  // ...
}
```

## 보안 유틸리티

- `requireAuth()` - 로그인 필수
- `requireAdmin()` - 관리자 권한 필수
- `requireInstructor()` - 강사 권한 필수
- `sanitizeHtml()` - XSS 방지
- `sanitizeFileName()` - 파일명 안전 처리
- `validateEmail()` - 이메일 검증
- `validatePhone()` - 전화번호 검증
