# 프로젝트 개요

바이브클래스 - AI와 함께하는 온라인 교육 플랫폼
- 도메인: https://vibeclass.kr

## 기술 스택

- Next.js 16 (App Router, Turbopack)
- TypeScript
- MySQL + Prisma ORM
- NextAuth.js (카카오 OAuth, Credentials)
- Tailwind CSS
- Google Gemini API
- Payssam 결제
- PM2 + Nginx + Let's Encrypt

## 첫 번째 가입자 자동 관리자

첫 번째로 가입하는 사용자는 자동으로 관리자(admin) 권한 부여
- 두 번째 가입자부터는 일반 사용자(customer)
