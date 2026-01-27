# 카카오 로그인 설정

## 1. 카카오 개발자 앱 생성

https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가하기

## 2. 플랫폼 설정

앱 설정 → 플랫폼 → Web 플랫폼 등록
- 개발: `http://localhost:3000`
- 운영: `https://vibeclass.kr`

## 3. 카카오 로그인 활성화

제품 설정 → 카카오 로그인 → 활성화 ON

Redirect URI:
- 개발: `http://localhost:3000/api/auth/callback/kakao`
- 운영: `https://vibeclass.kr/api/auth/callback/kakao`

## 4. 동의 항목

- 닉네임: 필수 동의
- 프로필 사진: 선택 동의
- 카카오계정(이메일): 선택 동의

## 5. 환경변수

```env
KAKAO_CLIENT_ID="REST_API_키"
KAKAO_CLIENT_SECRET="Client_Secret"
```

## 6. 비즈 앱 전환 (운영 필수)

앱 설정 → 비즈니스 → 비즈니스 앱 전환 신청
- 비즈 앱 전환 전에는 테스트 사용자만 로그인 가능
