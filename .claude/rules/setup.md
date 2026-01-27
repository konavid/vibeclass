# 설치 및 환경변수

## 설치

```bash
npm install
cp .env.local.example .env.local
cp .env.production.local.example .env.production.local
```

## 환경변수 파일

| 파일 | 환경 |
|------|------|
| `.env.local.example` | 개발 템플릿 |
| `.env.production.local.example` | 운영 템플릿 |
| `.env.local` | 개발 (gitignore) |
| `.env.production.local` | 운영 (gitignore) |

## 필수 환경변수

```env
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXT_PUBLIC_SITE_NAME="사이트 이름"
```

## 데이터베이스

```bash
npx prisma migrate dev
npx prisma db seed
```

## 실행

```bash
npm run dev
```
